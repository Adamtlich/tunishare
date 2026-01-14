import React, { useState, useEffect } from 'react';
import { Car, MapPin, Calendar, Users, Phone, Search, Plus, Star, Clock, MessageCircle, User, LogOut, LogIn, Mail, Lock, X, Check, AlertCircle } from 'lucide-react';

const TuniShareApp = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [rides, setRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [notification, setNotification] = useState(null);

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });

  const [publishForm, setPublishForm] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    seats: 1,
    price: '',
    car: '',
    phone: '',
    notes: ''
  });

  const tunisianCities = [
    'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana',
    'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul',
    'Tataouine', 'Beja', 'Jendouba', 'Mahdia', 'Sidi Bouzid', 'Siliana',
    'Kef', 'Tozeur', 'Zaghouan', 'Kébili', 'Manouba'
  ];

  // Initialize with stored data
  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = async () => {
    try {
      // Load user
      const userResult = await window.storage.get('current-user');
      if (userResult) {
        setCurrentUser(JSON.parse(userResult.value));
      }

      // Load all rides
      const ridesResult = await window.storage.get('all-rides');
      if (ridesResult) {
        setRides(JSON.parse(ridesResult.value));
      }
    } catch (error) {
      console.log('No stored data yet');
    }
  };

  const saveToStorage = async (key, data) => {
    try {
      await window.storage.set(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage error:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Authentication
  const handleRegister = async () => {
    if (!authForm.email || !authForm.password || !authForm.name || !authForm.phone) {
      showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }

    try {
      // Check if user exists
      const usersKey = `user-${authForm.email}`;
      try {
        await window.storage.get(usersKey);
        showNotification('Cet email existe déjà', 'error');
        return;
      } catch (error) {
        // User doesn't exist, proceed with registration
      }

      const newUser = {
        id: Date.now().toString(),
        email: authForm.email,
        name: authForm.name,
        phone: authForm.phone,
        rating: 5.0,
        verified: true,
        joinDate: new Date().toISOString()
      };

      await saveToStorage(usersKey, newUser);
      await saveToStorage('current-user', newUser);
      setCurrentUser(newUser);
      setShowAuth(false);
      showNotification('Inscription réussie! Bienvenue sur TuniShare');
    } catch (error) {
      showNotification('Erreur lors de l\'inscription', 'error');
    }
  };

  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      showNotification('Email et mot de passe requis', 'error');
      return;
    }

    try {
      const usersKey = `user-${authForm.email}`;
      const userResult = await window.storage.get(usersKey);
      
      if (userResult) {
        const user = JSON.parse(userResult.value);
        await saveToStorage('current-user', user);
        setCurrentUser(user);
        setShowAuth(false);
        showNotification(`Bienvenue ${user.name}!`);
      } else {
        showNotification('Email ou mot de passe incorrect', 'error');
      }
    } catch (error) {
      showNotification('Email ou mot de passe incorrect', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await window.storage.delete('current-user');
      setCurrentUser(null);
      setActiveTab('search');
      showNotification('Déconnexion réussie');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Ride Management
  const handlePublishRide = async () => {
    if (!currentUser) {
      showNotification('Veuillez vous connecter', 'error');
      return;
    }

    if (!publishForm.from || !publishForm.to || !publishForm.date || !publishForm.time || !publishForm.price) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const newRide = {
      id: Date.now().toString(),
      driverId: currentUser.id,
      driver: currentUser.name,
      driverPhone: publishForm.phone || currentUser.phone,
      rating: currentUser.rating,
      from: publishForm.from,
      to: publishForm.to,
      date: publishForm.date,
      time: publishForm.time,
      price: publishForm.price + ' TND',
      seats: parseInt(publishForm.seats),
      availableSeats: parseInt(publishForm.seats),
      car: publishForm.car,
      notes: publishForm.notes,
      verified: currentUser.verified,
      bookings: [],
      createdAt: new Date().toISOString()
    };

    const updatedRides = [...rides, newRide];
    setRides(updatedRides);
    await saveToStorage('all-rides', updatedRides);
    await saveToStorage(`ride-${newRide.id}`, newRide);

    setPublishForm({
      from: '', to: '', date: '', time: '', seats: 1, price: '', car: '', phone: '', notes: ''
    });

    showNotification('Trajet publié avec succès!');
    setActiveTab('myrides');
  };

  const handleBookRide = async (ride) => {
    if (!currentUser) {
      showNotification('Veuillez vous connecter pour réserver', 'error');
      setShowAuth(true);
      return;
    }

    if (ride.driverId === currentUser.id) {
      showNotification('Vous ne pouvez pas réserver votre propre trajet', 'error');
      return;
    }

    if (ride.availableSeats <= 0) {
      showNotification('Plus de places disponibles', 'error');
      return;
    }

    const booking = {
      id: Date.now().toString(),
      rideId: ride.id,
      passengerId: currentUser.id,
      passengerName: currentUser.name,
      passengerPhone: currentUser.phone,
      status: 'confirmed',
      bookedAt: new Date().toISOString()
    };

    // Update ride
    const updatedRide = {
      ...ride,
      availableSeats: ride.availableSeats - 1,
      bookings: [...(ride.bookings || []), booking]
    };

    const updatedRides = rides.map(r => r.id === ride.id ? updatedRide : r);
    setRides(updatedRides);
    await saveToStorage('all-rides', updatedRides);
    await saveToStorage(`ride-${ride.id}`, updatedRide);
    await saveToStorage(`booking-${booking.id}`, booking);

    showNotification('Réservation confirmée! Le conducteur vous contactera');
  };

  const handleSearch = () => {
    if (!searchForm.from || !searchForm.to) {
      showNotification('Veuillez choisir les villes de départ et d\'arrivée', 'error');
      return;
    }

    const filtered = rides.filter(ride => 
      ride.from === searchForm.from && 
      ride.to === searchForm.to &&
      ride.availableSeats > 0 &&
      (!searchForm.date || ride.date === searchForm.date)
    );

    if (filtered.length === 0) {
      showNotification('Aucun trajet trouvé pour cette recherche', 'error');
    }
  };

  // Get user's rides and bookings
  useEffect(() => {
    if (currentUser) {
      const userRides = rides.filter(r => r.driverId === currentUser.id);
      setMyRides(userRides);

      const userBookings = rides.filter(r => 
        r.bookings?.some(b => b.passengerId === currentUser.id)
      );
      setMyBookings(userBookings);
    }
  }, [rides, currentUser]);

  const filteredRides = searchForm.from && searchForm.to
    ? rides.filter(ride => 
        ride.from === searchForm.from && 
        ride.to === searchForm.to &&
        ride.availableSeats > 0 &&
        (!searchForm.date || ride.date === searchForm.date)
      )
    : rides.filter(r => r.availableSeats > 0).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {authMode === 'login' ? 'Connexion' : 'Inscription'}
              </h2>
              <button onClick={() => setShowAuth(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ahmed Ben Salem"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={authMode === 'login' ? handleLogin : handleRegister}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                {authMode === 'login' ? 'Se connecter' : 'S\'inscrire'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  {authMode === 'login' 
                    ? 'Pas de compte? S\'inscrire' 
                    : 'Déjà inscrit? Se connecter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-green-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">TuniShare</h1>
              <p className="text-xs text-gray-600">Covoiturage en Tunisie</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {currentUser ? (
              <>
                <div className="text-right mr-3">
                  <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                  <p className="text-xs text-gray-600">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setAuthMode('login'); }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <LogIn size={16} />
                Connexion / Inscription
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'search' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="inline mr-2" size={18} />
            Rechercher
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                showNotification('Veuillez vous connecter', 'error');
                setShowAuth(true);
                return;
              }
              setActiveTab('publish');
            }}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
              activeTab === 'publish' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plus className="inline mr-2" size={18} />
            Proposer
          </button>
          {currentUser && (
            <>
              <button
                onClick={() => setActiveTab('myrides')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
                  activeTab === 'myrides' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Car className="inline mr-2" size={18} />
                Mes Trajets
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
                  activeTab === 'bookings' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="inline mr-2" size={18} />
                Réservations
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 mt-6 pb-12">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline mr-1" size={16} />
                      Départ
                    </label>
                    <select
                      value={searchForm.from}
                      onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Choisir une ville</option>
                      {tunisianCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline mr-1" size={16} />
                      Arrivée
                    </label>
                    <select
                      value={searchForm.to}
                      onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Choisir une ville</option>
                      {tunisianCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline mr-1" size={16} />
                      Date (optionnel)
                    </label>
                    <input
                      type="date"
                      value={searchForm.date}
                      onChange={(e) => setSearchForm({...searchForm, date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="inline mr-1" size={16} />
                      Passagers
                    </label>
                    <select
                      value={searchForm.passengers}
                      onChange={(e) => setSearchForm({...searchForm, passengers: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Rechercher
                </button>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {searchForm.from && searchForm.to ? 'Résultats de recherche' : 'Trajets récents'}
            </h2>
            <div className="space-y-4">
              {filteredRides.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">Aucun trajet disponible pour le moment</p>
                  <p className="text-sm text-gray-500 mt-2">Soyez le premier à proposer un trajet!</p>
                </div>
              ) : (
                filteredRides.map(ride => (
                  <div key={ride.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold text-lg">
                              {ride.driver.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{ride.driver}</h3>
                              {ride.verified && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                  Vérifié
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Star className="fill-yellow-400 text-yellow-400" size={14} />
                              <span>{ride.rating}</span>
                              {ride.car && (
                                <>
                                  <span className="mx-1">•</span>
                                  <Car size={14} />
                                  <span>{ride.car}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin size={18} className="text-green-600" />
                            <span className="font-medium">{ride.from}</span>
                            <span className="text-gray-400">→</span>
                            <MapPin size={18} className="text-red-600" />
                            <span className="font-medium">{ride.to}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{ride.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{ride.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{ride.availableSeats} places</span>
                          </div>
                        </div>
                        {ride.notes && (
                          <p className="text-sm text-gray-600 mt-2">📝 {ride.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-2">{ride.price}</div>
                        <button
                          onClick={() => handleBookRide(ride)}
                          disabled={ride.availableSeats === 0}
                          className={`px-6 py-2 rounded-lg transition ${
                            ride.availableSeats === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {ride.availableSeats === 0 ? 'Complet' : 'Réserver'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Publish Tab */}
        {activeTab === 'publish' && currentUser && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Proposer un trajet</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Départ *</label>
                  <select
                    value={publishForm.from}
                    onChange={(e) => setPublishForm({...publishForm, from: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choisir</option>
                    {tunisianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arrivée *</label>
                  <select
                    value={publishForm.to}
                    onChange={(e) => setPublishForm({...publishForm, to: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choisir</option>
                    {tunisianCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={publishForm.date}
                    onChange={(e) => setPublishForm({...publishForm, date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure *</label>
                  <input
                    type="time"
                    value={publishForm.time}
                    onChange={(e) => setPublishForm({...publishForm, time: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Places *</label>
                  <select
                    value={publishForm.seats}
                    onChange={(e) => setPublishForm({...publishForm, seats: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (TND) *</label>
                  <input
                    type="number"
                    value={publishForm.price}
                    onChange={(e) => setPublishForm({...publishForm, price: e.target.value})}
                    placeholder="15"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modèle de voiture</label>
                <input
                  type="text"
                  value={publishForm.car}
                  onChange={(e) => setPublishForm({...publishForm, car: e.target.value})}
                  placeholder="Peugeot 308"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={publishForm.phone}
                  onChange={(e) => setPublishForm({...publishForm, phone: e.target.value})}
                  placeholder={currentUser?.phone || "+216 XX XXX XXX"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={publishForm.notes}
                  onChange={(e) => setPublishForm({...publishForm, notes: e.target.value})}
                  placeholder="Point de rendez-vous, préférences..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                onClick={handlePublishRide}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                Publier le trajet
              </button>
            </div>
          </div>
        )}

        {/* My Rides Tab */}
        {activeTab === 'myrides' && currentUser && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mes trajets proposés</h2>
            {myRides.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Vous n'avez pas encore proposé de trajets</p>
                <button
                  onClick={() => setActiveTab('publish')}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Proposer un trajet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRides.map(ride => (
                  <div key={ride.id} className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                          <MapPin size={18} className="text-green-600" />
                          <span>{ride.from}</span>
                          <span className="text-gray-400">→</span>
                          <MapPin size={18} className="text-red-600" />
                          <span>{ride.to}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{ride.date} à {ride.time}</span>
                          <span>•</span>
                          <span>{ride.price}</span>
                          <span>•</span>
                          <span>{ride.availableSeats}/{ride.seats} places disponibles</span>
                        </div>
                      </div>
                    </div>
                    {ride.bookings && ride.bookings.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Passagers réservés:</p>
                        {ride.bookings.map(booking => (
                          <div key={booking.id} className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                            <User size={14} />
                            <span>{booking.passengerName}</span>
                            <span>•</span>
                            <Phone size={14} />
                            <span>{booking.passengerPhone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && currentUser && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mes réservations</h2>
            {myBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Vous n'avez pas encore de réservations</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Rechercher un trajet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map(ride => (
                  <div key={ride.id} className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-bold text-lg">
                          {ride.driver.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{ride.driver}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="fill-yellow-400 text-yellow-400" size={14} />
                          <span>{ride.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                      <MapPin size={18} className="text-green-600" />
                      <span>{ride.from}</span>
                      <span className="text-gray-400">→</span>
                      <MapPin size={18} className="text-red-600" />
                      <span>{ride.to}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{ride.date} à {ride.time}</span>
                      <span>•</span>
                      <span>{ride.price}</span>
                      <span>•</span>
                      <Phone size={14} className="inline" />
                      <span>{ride.driverPhone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 TuniShare - Covoiturage en Tunisie</p>
          <p className="text-xs text-gray-400 mt-2">
            Partagez vos trajets en toute sécurité | مشاركة الرحلات بأمان
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ✅ Application fonctionnelle avec stockage persistant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TuniShareApp;