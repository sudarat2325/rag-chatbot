"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DeliveryMapProps {
  restaurantLocation: { latitude: number; longitude: number };
  deliveryLocation: { latitude: number; longitude: number };
  driverLocation?: { latitude: number; longitude: number };
  orderStatus?: string;
}

export default function DeliveryMap({
  restaurantLocation,
  deliveryLocation,
  driverLocation,
  orderStatus
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const restaurantMarker = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarker = useRef<mapboxgl.Marker | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken || mapboxToken === 'pk.demo.mapbox.token') {
      console.warn('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [deliveryLocation.longitude, deliveryLocation.latitude],
        zoom: 13
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    } catch (error) {
      console.error('Error initializing Mapbox:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Restaurant marker
    if (!restaurantMarker.current) {
      const el = document.createElement('div');
      el.style.cssText = 'width:40px;height:40px;background:#10b981;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
      el.innerHTML = '🏪';

      restaurantMarker.current = new mapboxgl.Marker(el)
        .setLngLat([restaurantLocation.longitude, restaurantLocation.latitude])
        .addTo(map.current);
    }

    // Delivery marker
    if (!deliveryMarker.current) {
      const el = document.createElement('div');
      el.style.cssText = 'width:40px;height:40px;background:#3b82f6;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
      el.innerHTML = '📍';

      deliveryMarker.current = new mapboxgl.Marker(el)
        .setLngLat([deliveryLocation.longitude, deliveryLocation.latitude])
        .addTo(map.current);
    }

    // Driver marker
    if (driverLocation) {
      if (!driverMarker.current) {
        const el = document.createElement('div');
        el.style.cssText = 'width:50px;height:50px;background:#f97316;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 2px 12px rgba(0,0,0,0.4)';
        el.innerHTML = '🛵';

        driverMarker.current = new mapboxgl.Marker(el)
          .setLngLat([driverLocation.longitude, driverLocation.latitude])
          .addTo(map.current);
      } else {
        driverMarker.current.setLngLat([driverLocation.longitude, driverLocation.latitude]);
      }

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([restaurantLocation.longitude, restaurantLocation.latitude]);
      bounds.extend([deliveryLocation.longitude, deliveryLocation.latitude]);
      bounds.extend([driverLocation.longitude, driverLocation.latitude]);

      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([restaurantLocation.longitude, restaurantLocation.latitude]);
      bounds.extend([deliveryLocation.longitude, deliveryLocation.latitude]);

      map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }

  }, [mapLoaded, restaurantLocation, deliveryLocation, driverLocation]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN === 'pk.demo.mapbox.token') {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold mb-2">แผนที่การจัดส่ง</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Demo Mode - ตั้งค่า NEXT_PUBLIC_MAPBOX_TOKEN เพื่อดูแผนที่จริง
        </p>
        <a
          href={`https://www.google.com/maps/dir/${restaurantLocation.latitude},${restaurantLocation.longitude}/${deliveryLocation.latitude},${deliveryLocation.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          เปิดใน Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {orderStatus && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">สถานะ</div>
          <div className="font-semibold">{orderStatus}</div>
        </div>
      )}
    </div>
  );
}

export { DeliveryMap };
