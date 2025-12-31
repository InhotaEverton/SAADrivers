import { supabase } from './supabaseClient';
import { Driver, User, Ride, Session } from '../types';
import { INITIAL_DRIVERS } from '../constants';

const KEYS = {
  SESSION: 'saa_session_v3',
};

// Mappers
const mapDriverFromDB = (d: any): Driver => ({
  id: d.id,
  name: d.name,
  vehicleType: d.vehicle_type,
  vehicleModel: d.vehicle_model,
  licensePlate: d.license_plate,
  cnh: d.cnh || '',
  rating: d.rating,
  available: d.available,
  trips: d.trips,
  phone: d.phone,
  coords: d.coords
});

const mapRideFromDB = (r: any): Ride => ({
  id: r.id,
  driverName: r.driver_name,
  vehicleType: r.vehicle_type,
  serviceType: r.service_type,
  origin: r.origin,
  destination: r.destination,
  price: r.price,
  paymentMethod: r.payment_method || 'DINHEIRO', // Fallback
  date: r.date,
  status: r.status
});

export const db = {
  // --- Motoristas ---
  getDrivers: async (): Promise<Driver[]> => {
    try {
      let { data, error } = await supabase.from('drivers').select('*');
      
      if (error) throw error;

      if (!data || data.length === 0) {
        return []; 
      }

      return data.map(mapDriverFromDB);
    } catch (e) {
      console.error("Erro Supabase drivers:", e);
      return [];
    }
  },

  addDriver: async (driver: Driver) => {
    const dbDriver = {
      id: driver.id,
      name: driver.name,
      vehicle_type: driver.vehicleType,
      vehicle_model: driver.vehicleModel,
      license_plate: driver.licensePlate,
      cnh: driver.cnh,
      rating: driver.rating,
      available: driver.available,
      trips: driver.trips,
      phone: driver.phone,
      coords: driver.coords
    };
    await supabase.from('drivers').insert(dbDriver);
  },

  addUser: async (user: User) => {
    const dbUser = {
      name: user.name,
      phone: user.phone,
      address: user.address
    };
    await supabase.from('users').insert(dbUser);
  },

  // --- Sessão Unificada ---
  getLocalSession: (): Session | null => {
    try {
      const stored = localStorage.getItem(KEYS.SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveSession: (session: Session) => {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  checkLogin: async (phone: string): Promise<Session | null> => {
    try {
      // 1. Tentar encontrar como Motorista
      const { data: drivers } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', phone)
        .limit(1);

      if (drivers && drivers.length > 0) {
        const driver = mapDriverFromDB(drivers[0]);
        return { type: 'driver', data: driver };
      }

      // 2. Tentar como Usuário
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .limit(1);

      if (users && users.length > 0) {
        const u = users[0];
        const user: User = { name: u.name, phone: u.phone, address: u.address || '' };
        return { type: 'client', data: user };
      }

      return null;
    } catch (e) {
      console.error("Erro no login:", e);
      return null;
    }
  },

  // --- Histórico ---
  getHistory: async (): Promise<Ride[]> => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapRideFromDB);
    } catch (e) {
      return [];
    }
  },

  addRide: async (ride: Ride) => {
    const dbRide = {
      id: ride.id,
      driver_name: ride.driverName,
      vehicle_type: ride.vehicleType,
      service_type: ride.serviceType,
      origin: ride.origin,
      destination: ride.destination,
      price: ride.price,
      payment_method: ride.paymentMethod, // Salva pagamento
      date: ride.date,
      status: ride.status
    };
    await supabase.from('rides').insert(dbRide);
  }
};