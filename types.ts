export enum VehicleType {
  MOTO = 'Moto',
  CARRO = 'Carro',
  VAN = 'Van'
}

export enum ServiceType {
  PASSENGER = 'Passageiro',
  DELIVERY = 'Entrega (Comida/Pequeno)',
  PACKAGE = 'Encomenda/Pacote',
  FREIGHT = 'Frete/Mudança'
}

export type PaymentMethod = 'DINHEIRO' | 'PIX';

export interface Driver {
  id: string;
  name: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  licensePlate: string;
  cnh: string;
  rating: number;
  available: boolean;
  trips: number;
  phone: string;
  coords: { x: number; y: number };
}

export interface User {
  name: string;
  phone: string;
  address: string;
}

export interface Ride {
  id: string;
  driverName: string;
  vehicleType: VehicleType;
  serviceType: string;
  origin?: string;
  destination: string;
  price: number;
  paymentMethod: PaymentMethod; // Novo campo
  date: string;
  status: 'completed' | 'cancelled' | 'pending';
}

export type ViewState = 'landing' | 'auth-user' | 'auth-driver' | 'app';
export type AppTab = 'home' | 'activity' | 'account' | 'dashboard';

export interface Session {
  type: 'client' | 'driver';
  data: User | Driver;
}