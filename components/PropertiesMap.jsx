"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'

// This is a common fix for a bug in react-leaflet where the default marker icons don't show up.
// It explicitly tells Leaflet where to find the icon image files.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const PropertiesMap = ({ properties }) => {
    // Filter out properties that don't have valid coordinates
    const validProperties = properties.filter(p => p.latitude && p.longitude);

    if (typeof window === 'undefined') {
        return null; // Don't render on the server
    }

    // Set a default center for the map. If there are properties, center on the first one.
    const mapCenter = validProperties.length > 0 
        ? [validProperties[0].latitude, validProperties[0].longitude] 
        : [9.0820, 8.6753]; // Default to center of Nigeria if no properties

    return (
        <MapContainer 
            center={mapCenter} 
            zoom={6} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {validProperties.map(property => (
                <Marker 
                    key={property.id} 
                    position={[property.latitude, property.longitude]}
                >
                    <Popup>
                        <div className="w-48">
                            <Link href={`/property/${property.id}`}>
                                <img src={property.image_url || '/placeholder-property-v2.jpg'} alt={property.title} className="h-24 w-full object-cover rounded-t-md" />
                                <div className="p-2">
                                    <h3 className="font-bold text-sm truncate">{property.title}</h3>
                                    <p className="text-xs text-gray-600">{property.location}</p>
                                    <p className="text-sm font-semibold text-green-600 mt-1">₦{property.rent.toLocaleString()}/month</p>
                                    <Link href={`/property/${property.id}`} passHref>
                                        <a className="text-xs text-blue-500 hover:underline mt-2 block text-center">View Details</a>
                                    </Link>
                                </div>
                            </Link>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}

export default PropertiesMap 