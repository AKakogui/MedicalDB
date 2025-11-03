'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Doctor } from '@/lib/types';
import Link from 'next/link';

// Fix for default icon not showing in some setups
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
  doctors: Doctor[];
  selectedDoctorId?: string | null;
}

const Map = ({ doctors, selectedDoctorId }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [51.505, -0.09],
        2
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  // Update markers when doctors list changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.removeFrom(mapRef.current!));
    markersRef.current = [];

    // Add new markers
    doctors.forEach((doctor) => {
      const marker = L.marker([doctor.latitude, doctor.longitude])
        .addTo(mapRef.current!)
        .bindPopup(
          `<div>
             <h3 class="font-bold">Dr. ${doctor.firstName} ${doctor.lastName}</h3>
             <p>${doctor.specialization}</p>
             <p>${doctor.address}</p>
             <a href="/doctors/${doctor.id}" class="text-primary hover:underline">View Profile</a>
           </div>`
        );
      markersRef.current.push(marker);
    });
  }, [doctors]);

  // Update map view when a doctor is selected
  useEffect(() => {
    if (!mapRef.current) return;

    const selectedDoctor = doctors.find((doc) => doc.id === selectedDoctorId);

    if (selectedDoctor) {
      mapRef.current.flyTo([selectedDoctor.latitude, selectedDoctor.longitude], 15);
      // Find and open the corresponding marker's popup
      const markerIndex = doctors.findIndex(doc => doc.id === selectedDoctorId);
      if (markerIndex !== -1 && markersRef.current[markerIndex]) {
        markersRef.current[markerIndex].openPopup();
      }

    } else if (doctors.length > 0) {
      const bounds = new L.LatLngBounds(doctors.map(d => [d.latitude, d.longitude]));
      if (bounds.isValid()) {
         mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedDoctorId, doctors]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    />
  );
};

export default Map;
