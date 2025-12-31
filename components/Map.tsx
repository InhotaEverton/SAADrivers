import React from 'react';
import { Driver, VehicleType } from '../types';
import { Car, Bike, Truck, MapPin } from 'lucide-react';

interface MapProps {
  drivers: Driver[];
  showPins: boolean;
  userDestination?: string;
  status: string;
}

export const Map: React.FC<MapProps> = ({ drivers, showPins, userDestination, status }) => {
  return (
    <div className="absolute inset-0 z-0 bg-gray-200 overflow-hidden">
      {/* Simulated Map Background - CSS Pattern */}
      <div className="w-full h-full opacity-30" 
           style={{
             backgroundImage: 'linear-gradient(#cbd5e1 2px, transparent 2px), linear-gradient(90deg, #cbd5e1 2px, transparent 2px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Decorative Map Roads */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <path d="M-10,100 Q150,50 400,100 T800,200" stroke="white" strokeWidth="20" fill="none" />
        <path d="M200,-10 L250,900" stroke="white" strokeWidth="25" fill="none" />
        <path d="M50,400 Q200,300 500,600" stroke="white" strokeWidth="15" fill="none" />
      </svg>

      {/* User Location (Always Center-ish) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping absolute -top-4 -left-4"></div>
          <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Drivers */}
      {showPins && drivers.map((driver) => {
        if (!driver.available) return null;
        
        return (
          <div 
            key={driver.id}
            className="absolute transition-all duration-1000 ease-in-out flex flex-col items-center"
            style={{ 
              top: `${driver.coords.y}%`, 
              left: `${driver.coords.x}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-white p-2 rounded-full shadow-md border border-gray-200 transform hover:scale-110 transition-transform">
              {driver.vehicleType === VehicleType.MOTO && <Bike className="w-5 h-5 text-gray-800" />}
              {driver.vehicleType === VehicleType.CARRO && <Car className="w-5 h-5 text-gray-800" />}
              {driver.vehicleType === VehicleType.VAN && <Truck className="w-5 h-5 text-gray-800" />}
            </div>
            {/* Optional label */}
            {status === 'searching' && (
               <div className="text-[10px] font-bold bg-white/80 px-1 rounded mt-1 shadow-sm">
                 {driver.vehicleType}
               </div>
            )}
          </div>
        );
      })}

      {/* Destination Pin if set */}
      {userDestination && (
         <div className="absolute top-[20%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
            <MapPin className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-xl" />
            <div className="bg-white px-2 py-1 rounded shadow text-xs font-bold -mt-12 whitespace-nowrap">
              {userDestination}
            </div>
         </div>
      )}
    </div>
  );
};