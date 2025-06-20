"use client"

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function ConversationPage() {
    const router = useRouter();
    const params = useParams();
    const { id: conversationId } = params;

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);


    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);
        };
        init();
    }, []);

    useEffect(() => {
        if (user && conversationId) {
            fetchConversation();
            const subscription = supabase
                .channel(`messages:conversation_id=eq.${conversationId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    setMessages(prevMessages => [...prevMessages, payload.new]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user, conversationId]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    const fetchConversation = async () => {
        setLoading(true);
        try {
            // Fetch conversation details
            const { data: convoData, error: convoError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    property:properties(*),
                    participant:users!conversations_user1_id_fkey(*),
                    owner:users!conversations_user2_id_fkey(*)
                `)
                .eq('id', conversationId)
                .single();

            if (convoError) throw convoError;
            setConversation(convoData);

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;
            setMessages(messagesData);

        } catch (error) {
            console.error('Error fetching conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !conversation) return;

        const receiverId = user.id === conversation.user1_id ? conversation.user2_id : conversation.user1_id;

        // Optimistic UI update
        const optimisticMessage = {
            id: Math.random().toString(36).substring(2, 9), // temp ID
            conversation_id: conversation.id,
            sender_id: user.id,
            receiver_id: receiverId,
            content: newMessage,
            created_at: new Date().toISOString(),
        };
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setNewMessage('');

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                receiver_id: receiverId,
                content: newMessage,
            });

        if (error) {
            console.error('Error sending message:', error);
            // Revert optimistic update on error
            setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
            alert("Failed to send message. Please try again.");
        }
    };
    
    if (loading || !conversation) {
        return <div className="p-4">Loading...</div>;
    }

    const otherUser = user.id === conversation.participant.id ? conversation.owner : conversation.participant;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto">
            <header className="p-4 border-b flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/messages">
                        <Button variant="ghost" size="icon"><ArrowLeft /></Button>
                    </Link>
                    <Avatar>
                        <AvatarImage src={otherUser.avatar_url} />
                        <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold">{otherUser.name}</h2>
                        <p className="text-sm text-gray-500">
                            Re: <Link href={`/property/${conversation.property.id}`} className="hover:underline">{conversation.property.title}</Link>
                        </p>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                    {messages.map(message => (
                        <div key={message.id} className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-md ${message.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-gray-200'}`}>
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">{new Date(message.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                    />
                    <Button type="submit" size="icon">
                        <Send />
                    </Button>
                </form>
            </footer>
        </div>
    );
} 