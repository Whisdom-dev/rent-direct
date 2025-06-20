"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function MessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                fetchConversations(user.id);
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchConversations = async (userId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id,
                    updated_at,
                    property:properties ( id, title, image_url ),
                    participant:users!conversations_user1_id_fkey ( id, name, avatar_url ),
                    owner:users!conversations_user2_id_fkey ( id, name, avatar_url ),
                    messages ( content, created_at, is_read, sender_id )
                `)
                .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            
            const processedConversations = data.map(convo => {
                const otherUser = convo.participant.id === userId ? convo.owner : convo.participant;
                const lastMessage = convo.messages[convo.messages.length - 1];
                const unreadCount = convo.messages.filter(m => !m.is_read && m.sender_id !== userId).length;
                return { ...convo, otherUser, lastMessage, unreadCount };
            });

            setConversations(processedConversations);

        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto p-4">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <MessageSquare className="h-6 w-6 mr-3" />
                        Your Conversations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading conversations...</p>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">You have no messages.</p>
                            <p className="text-sm text-gray-400 mt-2">Start a conversation from a property page.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {conversations.map(convo => (
                                <li key={convo.id} className="p-4 hover:bg-gray-50">
                                    <Link href={`/dashboard/messages/${convo.id}`} className="block">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={convo.otherUser.avatar_url} alt={convo.otherUser.name} />
                                                <AvatarFallback>{convo.otherUser.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold">{convo.otherUser.name}</p>
                                                    <p className="text-xs text-gray-500">{new Date(convo.updated_at).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Regarding: <span className="font-medium">{convo.property.title}</span>
                                                </p>
                                                {convo.lastMessage && (
                                                    <p className="text-sm text-gray-500 truncate mt-1">
                                                        {convo.lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                            {convo.unreadCount > 0 && <Badge color="primary">{convo.unreadCount}</Badge>}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 