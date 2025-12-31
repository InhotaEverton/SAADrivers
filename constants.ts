import { Driver, VehicleType } from './types';

export const CITY_NAME = "Santo Antônio do Amparo";
export const MOTO_FIXED_PRICE = 10.00;
export const PIX_KEY = "saa.drivers@email.com"; // Chave Pix do App ou do Motorista

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: '1',
    name: 'João Silva',
    vehicleType: VehicleType.MOTO,
    vehicleModel: 'Honda CG 160',
    licensePlate: 'ABC-1234',
    cnh: '12345678900',
    rating: 4.8,
    available: true,
    trips: 1240,
    phone: '(35) 99901-0001',
    coords: { x: 45, y: 55 }
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    vehicleType: VehicleType.CARRO,
    vehicleModel: 'Fiat Mobi',
    licensePlate: 'XYZ-9876',
    cnh: '98765432100',
    rating: 4.9,
    available: true,
    trips: 850,
    phone: '(35) 99901-0002',
    coords: { x: 60, y: 40 }
  },
  {
    id: '3',
    name: 'Carlos Santos',
    vehicleType: VehicleType.MOTO,
    vehicleModel: 'Yamaha Fazer',
    licensePlate: 'DEF-5678',
    cnh: '11223344556',
    rating: 4.7,
    available: true,
    trips: 2100,
    phone: '(35) 99901-0003',
    coords: { x: 30, y: 70 }
  },
  {
    id: '4',
    name: 'Ana Pereira',
    vehicleType: VehicleType.VAN,
    vehicleModel: 'Renault Master',
    licensePlate: 'GHI-4321',
    cnh: '66778899001',
    rating: 5.0,
    available: true,
    trips: 320,
    phone: '(35) 99901-0004',
    coords: { x: 75, y: 25 }
  },
  {
    id: '5',
    name: 'Pedro Costa',
    vehicleType: VehicleType.CARRO,
    vehicleModel: 'Chevrolet Onix',
    licensePlate: 'JKL-8765',
    cnh: '55443322110',
    rating: 4.6,
    available: true,
    trips: 940,
    phone: '(35) 99901-0005',
    coords: { x: 20, y: 35 }
  }
];