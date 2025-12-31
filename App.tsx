import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Bike, 
  Truck, 
  MapPin, 
  User as UserIcon, 
  Star, 
  ArrowLeft,
  Home,
  History,
  Phone,
  Package,
  CheckCircle,
  Calculator,
  Search,
  Wallet,
  TrendingUp,
  Power,
  Bell,
  Chrome,
  Navigation,
  MapPinIcon,
  Banknote,
  QrCode,
  Copy
} from 'lucide-react';

import { Driver, User, VehicleType, ViewState, AppTab, ServiceType, Ride, Session, PaymentMethod } from './types';
import { CITY_NAME } from './constants';
import { calculateServicePrice } from './services/geminiService';
import { db } from './services/db';
import { Button } from './components/Button';
import { Input } from './components/Input';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Data State
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [history, setHistory] = useState<Ride[]>([]);
  const [filterType, setFilterType] = useState<VehicleType | 'TODOS'>('TODOS');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Transaction State
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [origin, setOrigin] = useState(''); 
  const [destination, setDestination] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [priceQuote, setPriceQuote] = useState<{ price: number, reasoning: string } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('DINHEIRO'); 
  const [isCalculating, setIsCalculating] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Auth Inputs
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState(''); 
  const [authVehicleModel, setAuthVehicleModel] = useState('');
  const [authLicensePlate, setAuthLicensePlate] = useState('');
  const [authCNH, setAuthCNH] = useState('');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- Effects ---

  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      
      const storedSession = db.getLocalSession();
      if (storedSession) {
        setSession(storedSession);
        setView('app');
        if (storedSession.type === 'driver') setActiveTab('dashboard');
      }

      const [driversData, historyData] = await Promise.all([
        db.getDrivers(),
        db.getHistory()
      ]);

      setDrivers(driversData);
      setHistory(historyData);
      setIsLoadingData(false);
    };

    initData();
  }, []);

  // --- Handlers ---

  const handleAuthSubmit = async (e: React.FormEvent, type: 'client' | 'driver') => {
    e.preventDefault();
    setErrorMessage('');
    
    if (authMode === 'login') {
        setIsAuthenticating(true);
        const result = await db.checkLogin(authPhone);
        setIsAuthenticating(false);

        if (!result) {
            setErrorMessage('Conta não encontrada. Por favor, cadastre-se.');
            return;
        }

        if (type === 'driver' && result.type !== 'driver') {
            setErrorMessage('Este telefone pertence a uma conta de Cliente. Volte e entre como Cliente.');
            return;
        }

        if (type === 'client' && result.type !== 'client') {
            setErrorMessage('Este telefone é de um Motorista. Volte e use o acesso de Parceiro.');
            return;
        }

        db.saveSession(result);
        setSession(result);
        setView('app');
        setActiveTab(result.type === 'driver' ? 'dashboard' : 'home');

    } else {
        setIsAuthenticating(true);
        
        const existing = await db.checkLogin(authPhone);
        if (existing) {
            setIsAuthenticating(false);
            setErrorMessage('Este telefone já está cadastrado. Faça login.');
            return;
        }

        if (type === 'driver') {
            const newDriver: Driver = {
                id: Date.now().toString(),
                name: authName,
                phone: authPhone,
                vehicleType: VehicleType.MOTO, 
                vehicleModel: authVehicleModel,
                licensePlate: authLicensePlate,
                cnh: authCNH,
                rating: 5.0,
                available: true,
                trips: 0,
                coords: { x: 50, y: 50 }
            };
            await db.addDriver(newDriver);
            const session: Session = { type: 'driver', data: newDriver };
            db.saveSession(session);
            setSession(session);
            const updatedDrivers = await db.getDrivers();
            setDrivers(updatedDrivers);
            setView('app');
            setActiveTab('dashboard');
        } else {
            const newUser: User = {
                name: authName,
                phone: authPhone,
                address: authAddress || 'Santo Antônio do Amparo'
            };
            await db.addUser(newUser);
            const session: Session = { type: 'client', data: newUser };
            db.saveSession(session);
            setSession(session);
            setView('app');
            setActiveTab('home');
        }
        setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = () => {
      setIsAuthenticating(true);
      setTimeout(() => {
          setIsAuthenticating(false);
          alert("Em um app real, isso abriria o pop-up do Google. Por enquanto, use o cadastro normal.");
      }, 1000);
  };

  const handleLogout = () => {
    db.logout();
    setSession(null);
    setView('landing');
    setActiveTab('home');
    setAuthName('');
    setAuthPhone('');
    setAuthAddress('');
    setAuthVehicleModel('');
    setAuthLicensePlate('');
    setAuthCNH('');
    setErrorMessage('');
  };

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    setPriceQuote(null);
    setOrderSuccess(false);
    setOrigin('');
    setDestination('');
    setServiceType('');
    setSelectedPayment('DINHEIRO'); // Reset to default
  };

  const handleCalculate = async () => {
    if (!selectedDriver || !destination || !serviceType) return;
    setIsCalculating(true);
    const calcOrigin = (serviceType === ServiceType.PACKAGE || serviceType === ServiceType.DELIVERY) ? origin : 'Local Atual';
    
    const quote = await calculateServicePrice(
        selectedDriver.vehicleType, 
        serviceType, 
        calcOrigin,
        destination, 
        serviceDetails
    );
    setPriceQuote(quote);
    setIsCalculating(false);
  };

  const handleConfirmOrder = async () => {
    if (!selectedDriver || !priceQuote) return;
    setOrderSuccess(true);
    const newRide: Ride = {
      id: Date.now().toString(),
      driverName: selectedDriver.name,
      vehicleType: selectedDriver.vehicleType,
      serviceType: serviceType || 'Serviço',
      origin: origin || 'Local do Cliente',
      destination: destination,
      price: priceQuote.price,
      paymentMethod: selectedPayment,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'pending'
    };
    await db.addRide(newRide);
    const updatedHistory = await db.getHistory();
    setHistory(updatedHistory);
    setTimeout(() => {
        setSelectedDriver(null);
        setOrderSuccess(false);
        setPriceQuote(null);
        setOrigin('');
        setDestination('');
        setSelectedPayment('DINHEIRO');
    }, 3000);
  };

  const getDriverStats = () => {
    if (session?.type !== 'driver') return { earnings: 0, trips: 0, recentRides: [] };
    const driverName = session.data.name;
    const myRides = history.filter(r => r.driverName === driverName);
    const earnings = myRides.reduce((acc, curr) => acc + curr.price, 0);
    return { earnings, trips: myRides.length, recentRides: myRides.slice(0, 5) };
  };

  // --- UI Renders ---

  const renderLanding = () => (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-emerald-200 rotate-3">
            <MapPin className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SAA Drivers</h1>
            <p className="text-gray-500">O app de mobilidade oficial de<br/>Santo Antônio do Amparo.</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => { setView('auth-user'); setAuthMode('login'); }}
            className="w-full bg-gray-900 text-white p-4 rounded-xl font-semibold flex items-center justify-between shadow-lg shadow-gray-200 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-3">
                <div className="bg-gray-800 p-2 rounded-lg"><UserIcon className="w-5 h-5"/></div>
                <div className="text-left">
                    <div className="text-sm text-gray-400">Para você</div>
                    <div className="text-lg">Sou Cliente</div>
                </div>
            </div>
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>

          <button 
            onClick={() => { setView('auth-driver'); setAuthMode('login'); }}
            className="w-full bg-white border-2 border-emerald-100 text-emerald-800 p-4 rounded-xl font-semibold flex items-center justify-between hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg"><Car className="w-5 h-5 text-emerald-600"/></div>
                <div className="text-left">
                    <div className="text-sm text-emerald-600/70">Para parceiros</div>
                    <div className="text-lg">Sou Motorista</div>
                </div>
            </div>
            <ArrowLeft className="w-5 h-5 rotate-180 text-emerald-600" />
          </button>
        </div>
      </div>
      <div className="p-6 text-center text-xs text-gray-400">
          Versão 1.0.5 • Made with Gemini
      </div>
    </div>
  );

  const renderAuth = (type: 'client' | 'driver') => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-6 shadow-sm">
        <button onClick={() => setView('landing')} className="mb-4">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
            {type === 'client' ? 'Área do Cliente' : 'Área do Motorista'}
        </h2>
        <p className="text-gray-500 text-sm">
            {authMode === 'login' ? 'Entre para continuar' : 'Crie sua conta para começar'}
        </p>
      </div>

      <div className="p-6 flex-1">
          <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
              <button 
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${authMode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                  Entrar
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${authMode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                  Cadastrar
              </button>
          </div>

          {errorMessage && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-100">
                  {errorMessage}
              </div>
          )}

          <form onSubmit={(e) => handleAuthSubmit(e, type)} className="space-y-4">
              <Input 
                  label="WhatsApp (Login)" 
                  value={authPhone} 
                  onChange={e => setAuthPhone(e.target.value)} 
                  type="tel" 
                  placeholder="(35) 99999-9999"
                  required
              />

              {authMode === 'register' && (
                  <div className="animate-slide-up space-y-4">
                      <Input 
                          label="Nome Completo" 
                          value={authName} 
                          onChange={e => setAuthName(e.target.value)} 
                          placeholder="Ex: João da Silva"
                          required
                      />

                      {type === 'client' && (
                         <>
                            <Input 
                                label="Endereço Principal" 
                                value={authAddress} 
                                onChange={e => setAuthAddress(e.target.value)} 
                                placeholder="Rua, Número, Bairro"
                                required
                            />
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-50 text-gray-500">Ou registre-se com</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-5 h-5 flex items-center justify-center font-bold text-lg rounded-full">G</div>
                                Continuar com Google
                            </button>
                         </>
                      )}

                      {type === 'driver' && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                              <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">Dados do Veículo & CNH</h3>
                              <Input 
                                  label="Modelo Veículo" 
                                  placeholder="Ex: Honda Fan 160" 
                                  value={authVehicleModel}
                                  onChange={e => setAuthVehicleModel(e.target.value)}
                                  required
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Placa" 
                                    placeholder="ABC-1234" 
                                    value={authLicensePlate}
                                    onChange={e => setAuthLicensePlate(e.target.value)}
                                    required
                                />
                                <Input 
                                    label="CNH" 
                                    placeholder="Nº Registro" 
                                    value={authCNH}
                                    onChange={e => setAuthCNH(e.target.value)}
                                    required
                                />
                              </div>
                          </div>
                      )}
                  </div>
              )}

              <div className="pt-4">
                <Button type="submit" isLoading={isAuthenticating}>
                    {authMode === 'login' ? 'Entrar no App' : 'Concluir Cadastro'}
                </Button>
              </div>
          </form>
      </div>
    </div>
  );

  // --- DRIVER DASHBOARD ---
  const renderDriverDashboard = () => {
    const driver = session?.data as Driver;
    const stats = getDriverStats();
    
    const pendingRides = history.filter(r => r.status === 'pending' && r.driverName === driver.name);

    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        <div className="bg-gray-900 text-white p-6 rounded-b-[2rem] shadow-xl relative">
          <div className="flex justify-between items-start mb-6">
             <div>
               <h2 className="text-2xl font-bold">Olá, {driver.name.split(' ')[0]}</h2>
               <div className="flex items-center text-emerald-400 mt-1">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                 <span className="text-sm font-medium">Online</span>
               </div>
             </div>
             <div className="bg-gray-800 p-2 rounded-xl relative">
                <Bell className="w-6 h-6 text-gray-400" />
                {pendingRides.length > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800"></span>
                )}
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-2xl">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Saldo</span>
              <div className="text-2xl font-bold mt-1 text-emerald-400">R$ {stats.earnings.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-2xl">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Viagens</span>
              <div className="text-2xl font-bold mt-1 text-white">{stats.trips}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* NOTIFICATION AREA - NEW REQUESTS */}
          {pendingRides.length > 0 && (
              <div className="animate-slide-up">
                 <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg">Solicitações Pendentes</h3>
                 </div>
                 
                 {pendingRides.map(ride => (
                     <div key={ride.id} className="bg-white p-5 rounded-2xl shadow-lg border-l-4 border-emerald-500 mb-4">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold uppercase">{ride.serviceType}</span>
                            <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">R$ {ride.price.toFixed(2)}</div>
                                <div className={`text-xs font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${ride.paymentMethod === 'PIX' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {ride.paymentMethod === 'PIX' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                    {ride.paymentMethod}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 relative pl-4 border-l-2 border-gray-200 ml-1">
                            {ride.origin && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Coleta</p>
                                    <p className="text-sm font-medium text-gray-900">{ride.origin}</p>
                                </div>
                            )}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-gray-400 uppercase font-semibold">Entrega</p>
                                <p className="text-sm font-medium text-gray-900">{ride.destination}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button className="h-10 text-sm">Aceitar Corrida</Button>
                            <Button variant="outline" className="h-10 text-sm">Recusar</Button>
                        </div>
                     </div>
                 ))}
              </div>
          )}

          <div>
             <h3 className="font-bold text-gray-800 text-lg mb-4">Últimas Corridas</h3>
             <div className="space-y-3">
                {stats.recentRides.filter(r => r.status !== 'pending').length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-gray-100">
                        <p className="text-gray-500">Nenhuma corrida finalizada.</p>
                    </div>
                ) : (
                    stats.recentRides.filter(r => r.status !== 'pending').map(ride => (
                        <div key={ride.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between opacity-75">
                            <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{ride.serviceType}</h4>
                                <p className="text-xs text-gray-500">{ride.destination}</p>
                            </div>
                            </div>
                            <span className="font-bold text-emerald-600">+ R$ {ride.price.toFixed(2)}</span>
                        </div>
                    ))
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClientHome = () => (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Olá, {session?.data.name.split(' ')[0]}</h2>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <MapPin className="w-3 h-3 mr-1" /> {CITY_NAME}
          </p>
        </div>
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
          {session?.data.name.charAt(0)}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
        {['TODOS', VehicleType.MOTO, VehicleType.CARRO, VehicleType.VAN].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === type 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type === 'TODOS' ? 'Todos' : type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoadingData ? (
          <div className="text-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-400">Carregando motoristas...</p>
          </div>
        ) : (
          <>
            {drivers
              .filter(d => filterType === 'TODOS' || d.vehicleType === filterType)
              .map(driver => (
              <div 
                key={driver.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-emerald-500 transition-all cursor-pointer relative overflow-hidden group"
                onClick={() => handleDriverSelect(driver)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    {driver.vehicleType === VehicleType.MOTO && <Bike className="w-8 h-8 text-emerald-600" />}
                    {driver.vehicleType === VehicleType.CARRO && <Car className="w-8 h-8 text-blue-600" />}
                    {driver.vehicleType === VehicleType.VAN && <Truck className="w-8 h-8 text-orange-600" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900">{driver.name}</h3>
                      <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                        {driver.rating}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{driver.vehicleModel} • {driver.licensePlate}</p>
                  </div>
                </div>
              </div>
            ))}
            {drivers.filter(d => filterType === 'TODOS' || d.vehicleType === filterType).length === 0 && (
                <div className="text-center py-8 text-gray-400">Nenhum disponível.</div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderModal = () => {
    if (!selectedDriver) return null;

    if (orderSuccess) {
      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pedido Enviado!</h3>
            <p className="text-gray-500 mb-4">
              {selectedDriver.name} recebeu sua solicitação.
              <br/>
              Pagamento via: <strong>{selectedPayment}</strong>
            </p>
          </div>
        </div>
      );
    }

    const needsOrigin = serviceType === ServiceType.PACKAGE || serviceType === ServiceType.DELIVERY;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h3 className="font-bold text-lg">{selectedDriver.name}</h3>
            <button onClick={() => setSelectedDriver(null)} className="text-gray-400 font-bold p-2">✕</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
              <div className="grid grid-cols-2 gap-2">
                {([VehicleType.MOTO, VehicleType.CARRO, VehicleType.VAN].includes(selectedDriver.vehicleType) 
                   ? [ServiceType.DELIVERY, ServiceType.PASSENGER, ServiceType.PACKAGE, ServiceType.FREIGHT]
                   : [ServiceType.DELIVERY] 
                 ).map(srv => {
                     if (selectedDriver.vehicleType === VehicleType.MOTO && srv === ServiceType.FREIGHT) return null;
                     if (selectedDriver.vehicleType === VehicleType.VAN && srv === ServiceType.DELIVERY) return null;
                     return (
                      <button
                        key={srv}
                        onClick={() => { setServiceType(srv); setPriceQuote(null); }}
                        className={`p-3 rounded-lg text-sm font-medium border text-left transition-all ${
                          serviceType === srv 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' 
                          : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {srv}
                      </button>
                    )
                 })}
              </div>
            </div>

            {/* Campos de Localização */}
            <div className="space-y-3">
                {needsOrigin && (
                   <Input 
                        label="Onde buscar? (Coleta)" 
                        placeholder="Endereço de retirada" 
                        value={origin} 
                        onChange={e => { setOrigin(e.target.value); setPriceQuote(null); }} 
                        className="border-emerald-200 bg-emerald-50/30"
                   />
                )}
                
                <Input 
                    label={needsOrigin ? "Onde entregar? (Destino)" : "Destino"} 
                    placeholder="Endereço de destino" 
                    value={destination} 
                    onChange={e => { setDestination(e.target.value); setPriceQuote(null); }} 
                />
            </div>

            {(selectedDriver.vehicleType !== VehicleType.MOTO || serviceType === ServiceType.DELIVERY) && (
               <Input label="Detalhes" placeholder="O que será transportado?" value={serviceDetails} onChange={e => setServiceDetails(e.target.value)} />
            )}
            
            {priceQuote && (
              <div className="space-y-4 animate-slide-up">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <div className="text-2xl font-bold text-emerald-800">R$ {priceQuote.price.toFixed(2)}</div>
                      <p className="text-xs text-emerald-600">{priceQuote.reasoning}</p>
                  </div>

                  {/* SELEÇÃO DE PAGAMENTO SIMPLIFICADA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Como você vai pagar?</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSelectedPayment('DINHEIRO')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedPayment === 'DINHEIRO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-200 text-gray-500'}`}
                        >
                            <Banknote className="w-6 h-6 mb-1" />
                            <span className="text-sm font-bold">Dinheiro</span>
                        </button>
                        <button
                            onClick={() => setSelectedPayment('PIX')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedPayment === 'PIX' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-gray-200 text-gray-500'}`}
                        >
                            <QrCode className="w-6 h-6 mb-1" />
                            <span className="text-sm font-bold">Pix</span>
                        </button>
                    </div>
                  </div>

                  {/* MENSAGEM INFORMATIVA DE PAGAMENTO NO LOCAL */}
                  {selectedPayment === 'PIX' && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-center animate-slide-up">
                          <p className="text-xs text-purple-700 font-medium">
                            Você escolheu Pix. O pagamento deve ser feito <strong>diretamente ao motorista</strong> no momento do encontro.
                          </p>
                      </div>
                  )}
                  
                  {selectedPayment === 'DINHEIRO' && (
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center animate-slide-up">
                          <p className="text-xs text-emerald-700 font-medium">
                            Pagamento em dinheiro <strong>diretamente ao motorista</strong>. Facilite o troco se possível.
                          </p>
                      </div>
                  )}

                  <Button onClick={handleConfirmOrder}>
                    Confirmar Pedido
                  </Button>
              </div>
            )}
            
            {!priceQuote && (
                <div className="pt-4">
                    <Button 
                        onClick={handleCalculate} 
                        disabled={!destination || !serviceType || (needsOrigin && !origin)} 
                        isLoading={isCalculating} 
                        variant="secondary"
                    >
                        Ver Valor
                    </Button>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActivityTab = () => (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">Histórico</h2>
      <div className="space-y-4">
        {history.length === 0 && <div className="text-center text-gray-400 py-10">Nenhuma atividade.</div>}
        {history.map(ride => (
            <div key={ride.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{ride.serviceType}</h4>
                    <p className="text-xs text-gray-500 mt-1">{ride.date} • {ride.driverName}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-1">R$ {ride.price.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{ride.paymentMethod}</span>
                  </div>
                </div>
                {ride.origin && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
                        <div className="flex items-center text-xs text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></div>
                            {ride.origin}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
                            {ride.destination}
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
          {session?.data.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold">{session?.data.name}</h2>
          <p className="text-sm text-gray-500">{session?.data.phone}</p>
          {'address' in session!.data && <p className="text-xs text-gray-400 mt-1">{(session!.data as User).address}</p>}
        </div>
      </div>
      <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-500 hover:bg-red-50">Sair da Conta</Button>
    </div>
  );

  // --- Main Render Logic ---

  if (view === 'landing') return renderLanding();
  if (view === 'auth-user') return renderAuth('client');
  if (view === 'auth-driver') return renderAuth('driver');

  const isDriver = session?.type === 'driver';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'home' && !isDriver && renderClientHome()}
        {activeTab === 'dashboard' && isDriver && renderDriverDashboard()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'account' && renderAccountTab()}
      </div>

      {selectedDriver && renderModal()}

      <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center absolute bottom-0 w-full z-40 max-w-full">
        {!isDriver ? (
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
            <Home className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">Início</span>
          </button>
        ) : (
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
            <TrendingUp className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">Painel</span>
          </button>
        )}
        <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'activity' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
          <History className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">Histórico</span>
        </button>
        <button onClick={() => setActiveTab('account')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'account' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
          <UserIcon className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">Conta</span>
        </button>
      </div>
    </div>
  );
};

export default App;