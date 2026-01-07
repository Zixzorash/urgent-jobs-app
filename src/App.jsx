import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc,
  where
} from 'firebase/firestore';
import { 
  MapPin, Send, User, Briefcase, MessageCircle, CheckCircle, 
  Clock, PlusCircle, LogOut, Bell, Navigation, Image as ImageIcon, 
  X, Zap, ChevronLeft, LogIn, Search, Filter, MoreVertical, 
  ShieldCheck, Package, Users, ShoppingBag, Utensils, 
  SprayCan, Truck, Wrench, Grid, Calendar, Phone,
  Home, Eye, Car, Shirt, Plane, Monitor, Shield, 
  Dumbbell, Gamepad2, PawPrint, HeartHandshake, Key,
  LocateFixed, ArrowRight, Loader2, Route, 
  UserCog, Lock, ChevronRight, BellRing, ToggleLeft, ToggleRight,
  MessageSquare, XCircle, CheckCircle2, UserCircle2, Map, Camera
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrqkeQLoTApDsORzhS5N8xkbHGQ97Hs6Q",
  authDomain: "urgent-jobs-app.firebaseapp.com",
  projectId: "urgent-jobs-app",
  storageBucket: "urgent-jobs-app.firebasestorage.app",
  messagingSenderId: "256553913224",
  appId: "1:256553913224:web:16bd14246a02989344483d"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId ='urgent-jobs-v1';

// --- Services Data ---
const SERVICES = [
  // หมวดขนส่งและเดินทาง
  { id: 'transport', name: 'รับ-ส่ง คน', icon: <Car />, color: 'bg-blue-100 text-blue-600', type: 'route' },
  { id: 'driver', name: 'คนขับรถ', icon: <Key />, color: 'bg-indigo-100 text-indigo-600', type: 'route' },
  { id: 'messenger', name: 'รับส่งของ', icon: <Package />, color: 'bg-sky-100 text-sky-600', type: 'route' },
  { id: 'move', name: 'ช่วยขนย้าย', icon: <Truck />, color: 'bg-amber-100 text-amber-600', type: 'route' },
  // หมวดดูแลและงานบ้าน
  { id: 'maid', name: 'หาแม่บ้าน', icon: <Home />, color: 'bg-rose-100 text-rose-600', type: 'single' },
  { id: 'laundry', name: 'ฝากซักผ้า', icon: <Shirt />, color: 'bg-cyan-100 text-cyan-600', type: 'route' },
  { id: 'clean', name: 'ทำความสะอาด', icon: <SprayCan />, color: 'bg-teal-100 text-teal-600', type: 'single' },
  // หมวดดูแลพิเศษ
  { id: 'pet_care', name: 'ดูแลสัตว์เลี้ยง', icon: <PawPrint />, color: 'bg-orange-100 text-orange-600', type: 'single' }, 
  { id: 'elder_care', name: 'ดูแลผู้สูงอายุ', icon: <HeartHandshake />, color: 'bg-red-100 text-red-600', type: 'single' }, 
  { id: 'bodyguard', name: 'บอดี้การ์ด', icon: <Shield />, color: 'bg-slate-100 text-slate-600', type: 'single' },
  // หมวดซื้อและกิน
  { id: 'shopping', name: 'ฝากซื้อของ', icon: <ShoppingBag />, color: 'bg-green-100 text-green-600', type: 'route' },
  { id: 'food', name: 'ซื้ออาหาร', icon: <Utensils />, color: 'bg-lime-100 text-lime-600', type: 'route' },
  { id: 'queue', name: 'ต่อคิว', icon: <Users />, color: 'bg-purple-100 text-purple-600', type: 'single' },
  // หมวดเพื่อนและกิจกรรม
  { id: 'travel_buddy', name: 'หาเพื่อนเที่ยว', icon: <Plane />, color: 'bg-pink-100 text-pink-600', type: 'single' },
  { id: 'sport_buddy', name: 'เพื่อนเล่นกีฬา', icon: <Dumbbell />, color: 'bg-emerald-100 text-emerald-600', type: 'single' },
  { id: 'game_buddy', name: 'คนเล่นเกมส์', icon: <Gamepad2 />, color: 'bg-violet-100 text-violet-600', type: 'single' },
  // หมวดงานวิชาชีพและอื่นๆ
  { id: 'it_tech', name: 'ช่างไอที', icon: <Monitor />, color: 'bg-blue-50 text-blue-800', type: 'single' },
  { id: 'detective', name: 'หานักสืบ', icon: <Eye />, color: 'bg-gray-100 text-gray-800', type: 'single' },
  { id: 'fix', name: 'งานช่าง', icon: <Wrench />, color: 'bg-yellow-100 text-yellow-600', type: 'single' },
  { id: 'general', name: 'งานทั่วไป', icon: <Grid />, color: 'bg-fuchsia-100 text-fuchsia-600', type: 'single' },
];

// --- Utility Functions ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(price);
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// --- Leaflet Helper ---
const loadLeafletAssets = () => {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('leaflet-js')) {
    const script = document.createElement('script');
    script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    return new Promise((resolve) => {
       script.onload = resolve;
       document.body.appendChild(script);
    });
  }
  return Promise.resolve();
};

// --- Map Components ---
const LeafletMapPicker = ({ lat, lng, onSelectLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadLeafletAssets().then(initMap);
    function initMap() {
      if (!window.L || mapInstanceRef.current) return;
      const initialLat = lat || 13.7563;
      const initialLng = lng || 100.5018;
      mapInstanceRef.current = window.L.map(mapRef.current).setView([initialLat, initialLng], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapInstanceRef.current);
      const customIcon = window.L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
      markerRef.current = window.L.marker([initialLat, initialLng], { draggable: true, icon: customIcon }).addTo(mapInstanceRef.current);
      markerRef.current.on('dragend', function(e) { const pos = markerRef.current.getLatLng(); if (onSelectLocation) onSelectLocation(pos.lat, pos.lng); });
      mapInstanceRef.current.on('click', function(e) { markerRef.current.setLatLng(e.latlng); if (onSelectLocation) onSelectLocation(e.latlng.lat, e.latlng.lng); });
    }
  }, []);
  return <div ref={mapRef} style={{ height: '240px', width: '100%', borderRadius: '12px', zIndex: 0 }} />;
};

const LeafletFormMap = ({ startLocation, endLocation, isRoute }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    loadLeafletAssets().then(initMap);
    function initMap() {
       if (!window.L || mapInstanceRef.current) return;
       const map = window.L.map(mapRef.current).setView([13.7563, 100.5018], 11);
       window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
       mapInstanceRef.current = map;
       layerGroupRef.current = window.L.layerGroup().addTo(map);
    }
  }, []);

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current || !layerGroupRef.current) return;
    const lg = layerGroupRef.current;
    lg.clearLayers();
    const Icon = window.L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41] });
    const RedIcon = window.L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const GreenIcon = window.L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

    if (isRoute) {
        const bounds = [];
        if (startLocation) { window.L.marker([startLocation.lat, startLocation.lng], { icon: GreenIcon }).addTo(lg).bindPopup("ต้นทาง"); bounds.push([startLocation.lat, startLocation.lng]); }
        if (endLocation) { window.L.marker([endLocation.lat, endLocation.lng], { icon: RedIcon }).addTo(lg).bindPopup("ปลายทาง"); bounds.push([endLocation.lat, endLocation.lng]); }
        if (bounds.length === 2) { window.L.polyline(bounds, { color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }).addTo(lg); mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] }); } 
        else if (bounds.length === 1) { mapInstanceRef.current.setView(bounds[0], 14); }
    } else {
        if (startLocation) { window.L.marker([startLocation.lat, startLocation.lng], { icon: Icon }).addTo(lg); mapInstanceRef.current.setView([startLocation.lat, startLocation.lng], 15); }
    }
  }, [startLocation, endLocation, isRoute]);
  return <div ref={mapRef} className="w-full h-48 rounded-lg z-0 border border-gray-200 mt-2 bg-gray-50" />;
}

// --- Styles ---
const styles = {
  primaryGradient: "bg-gradient-to-r from-orange-500 to-amber-500",
  card: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
  input: "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all",
  label: "text-sm font-bold text-gray-700 mb-1 block",
  buttonPrimary: "w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl active:scale-95 transition-all",
  buttonSecondary: "w-full bg-white text-gray-700 font-bold py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
};

// --- Main Component ---
export default function UrgentJobsApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [userLocation, setUserLocation] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestActionName, setGuestActionName] = useState('');

  // Set Favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/svg+xml'; link.rel = 'icon';
    link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23f97316%22 /><path d=%22M60 10L30 50h20l-10 40 30-40H50z%22 fill=%22white%22 stroke=%22white%22 stroke-width=%224%22 stroke-linejoin=%22round%22/></svg>`;
    document.getElementsByTagName('head')[0].appendChild(link);
    document.title = "จ๊อบด่วน | Urgent Jobs";
  }, []);

  // Auth & Location
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => console.log("Location access denied")
      );
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
        const snap = await getDoc(userRef);
        setUserData(snap.exists() ? snap.data() : { displayName: currentUser.email.split('@')[0] });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (targetView, actionName = 'ใช้งานส่วนนี้') => {
    if (['post', 'my-jobs', 'profile', 'profile-edit', 'profile-notifications'].includes(targetView) && !user) {
      setGuestActionName(actionName);
      setShowGuestModal(true);
    } else {
      setView(targetView);
    }
  };

  const handleCategoryClick = (category) => {
    if (!user) {
      setGuestActionName(`จ้าง${category.name}`);
      setShowGuestModal(true);
    } else {
      setSelectedCategory(category);
      setView('post');
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white text-orange-500">
      <Zap className="animate-pulse w-16 h-16 mb-4" />
      <p className="font-medium text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50/50 shadow-2xl overflow-hidden font-sans text-gray-800">
      {/* Header */}
      {view !== 'auth' && (
        <header className={`${styles.primaryGradient} text-white px-5 py-4 flex items-center justify-between shadow-md z-20`}>
          <div className="flex items-center gap-2" onClick={() => setView('home')}>
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">จ๊อบด่วน | Urgent Jobs</h1>
              <p className="text-[10px] opacity-80 font-light text-white/90">จ๊อบด่วน จบงานเร็ว รับเงินทันที ~*</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
               <p className="text-xs font-medium opacity-90">{userData?.displayName || 'ผู้เยี่ยมชม'}</p>
               <div className="flex items-center justify-end text-[10px] opacity-75">
                 <MapPin className="w-3 h-3 mr-0.5" /> 
                 {userLocation ? 'ระบุพิกัดแล้ว' : 'ไม่ระบุพิกัด'}
               </div>
             </div>
             {/* Profile Icon with Image */}
             <div onClick={() => navigateTo('profile')} className="w-9 h-9 rounded-full border-2 border-white/50 overflow-hidden cursor-pointer bg-white/20 flex items-center justify-center">
               {userData?.photoBase64 ? (
                 <img src={userData.photoBase64} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-5 h-5 text-white" />
               )}
             </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar">
        {view === 'auth' && <AuthScreen setUserData={setUserData} setView={setView} />}
        {view === 'home' && <HomeScreen user={user} onCategoryClick={handleCategoryClick} userLocation={userLocation} setSelectedJob={setSelectedJob} setView={setView} />}
        {view === 'post' && <PostJobScreen user={user} setView={setView} userLocation={userLocation} selectedCategory={selectedCategory} />}
        {view === 'my-jobs' && <MyJobsScreen user={user} setView={setView} setSelectedJob={setSelectedJob} />}
        {view === 'profile' && <ProfileScreen user={user} userData={userData} setView={setView} navigateTo={navigateTo} />}
        {view === 'profile-edit' && <ProfileEditScreen user={user} userData={userData} setView={setView} setUserData={setUserData} />}
        {view === 'profile-notifications' && <NotificationSettingsScreen setView={setView} />}
        {view === 'job-detail' && <JobDetailScreen user={user} job={selectedJob} setView={setView} checkAuth={() => navigateTo('auth', 'รับงานนี้')} userData={userData} />}
      </main>

      {/* Bottom Nav */}
      {view !== 'auth' && view !== 'job-detail' && !view.startsWith('profile-') && (
        <nav className="bg-white border-t border-gray-100 flex justify-around p-2 pb-5 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 rounded-t-2xl">
          <NavItem icon={<Briefcase />} label="หน้าแรก" active={view === 'home'} onClick={() => setView('home')} />
          <NavItem icon={<PlusCircle />} label="โพสต์งาน" active={view === 'post'} onClick={() => navigateTo('post', 'โพสต์งาน')} isCenter />
          <NavItem icon={<CheckCircle />} label="งานของฉัน" active={view === 'my-jobs'} onClick={() => navigateTo('my-jobs', 'ดูงานของคุณ')} />
          <NavItem icon={<User />} label="โปรไฟล์" active={view === 'profile'} onClick={() => navigateTo('profile', 'ดูโปรไฟล์')} />
        </nav>
      )}

      {/* Guest Modal */}
      {showGuestModal && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-100 p-4 rounded-full">
                <ShieldCheck className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h3>
            <p className="text-center text-gray-500 mb-6 text-sm">
              คุณต้องเป็นสมาชิกเพื่อ <span className="text-orange-600 font-bold">"{guestActionName}"</span>
            </p>
            <div className="space-y-3">
              <button onClick={() => { setShowGuestModal(false); setView('auth'); }} className={styles.buttonPrimary}>
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
              <button onClick={() => setShowGuestModal(false)} className={styles.buttonSecondary}>
                ไว้คราวหลัง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components ---

function NavItem({ icon, label, active, onClick, isCenter }) {
  if (isCenter) {
    return (
      <button onClick={onClick} className="relative -top-6 group">
        <div className={`w-14 h-14 rounded-full ${styles.primaryGradient} flex items-center justify-center shadow-lg shadow-orange-200 ring-4 ring-white transition-transform active:scale-90`}>
          {React.cloneElement(icon, { size: 28, className: "text-white" })}
        </div>
        <span className="text-[10px] font-bold text-gray-500 absolute -bottom-4 left-1/2 -translate-x-1/2 w-max">{label}</span>
      </button>
    );
  }
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 w-16 py-1 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'}`}
    >
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function LocationSelector({ label, value, onChange, placeholder, iconColor, userLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const initialLat = value?.lat || userLocation?.lat || 13.7563;
  const initialLng = value?.lng || userLocation?.lng || 100.5018;

  const handleSelect = (place) => {
    onChange(place);
    setIsOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCurrentLocation = () => {
    if (userLocation) {
      onChange({ name: 'ตำแหน่งปัจจุบันของคุณ', address: `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`, lat: userLocation.lat, lng: userLocation.lng });
      setIsOpen(false);
    } else {
      alert('ไม่สามารถระบุตำแหน่งปัจจุบันได้');
    }
  };
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchTerm}&countrycodes=th&limit=5`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Error fetching places:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleMapSelect = async (lat, lng) => {
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          const placeName = data.display_name.split(',')[0];
          onChange({
              name: placeName || 'ตำแหน่งที่เลือกบนแผนที่',
              address: data.display_name,
              lat: lat,
              lng: lng
          });
      } catch (e) {
          onChange({
              name: 'ตำแหน่งที่เลือก',
              address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
              lat: lat,
              lng: lng
          });
      }
  };

  return (
    <>
      <div className="mb-3">
        <label className={styles.label}>{label}</label>
        <div onClick={() => setIsOpen(true)} className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${iconColor} bg-opacity-20`}>
             <MapPin className={`w-5 h-5 ${iconColor.replace('bg-', 'text-').replace('opacity-20', '')}`} />
           </div>
           <div className="flex-1 overflow-hidden">
             {value ? (
               <div>
                 <p className="font-bold text-sm text-gray-800 truncate">{value.name}</p>
                 <p className="text-xs text-gray-500 truncate">{value.address}</p>
               </div>
             ) : (
               <p className="text-gray-400 text-sm">{placeholder}</p>
             )}
           </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-200">
           <div className="p-4 border-b flex items-center gap-3">
             <button onClick={() => setIsOpen(false)}><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
             <div className="flex-1 bg-gray-100 rounded-lg flex items-center px-3 py-2">
               <Search className="w-4 h-4 text-gray-400 mr-2" />
               <input 
                 autoFocus
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none w-full text-sm"
                 placeholder="ค้นหาสถานที่..."
               />
               {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-4 h-4 text-gray-400" /></button>}
             </div>
           </div>

           <div className="flex-1 overflow-y-auto bg-gray-50 relative">
             {!searchTerm && (
                <>
                    <div onClick={handleCurrentLocation} className="bg-white p-4 border-b flex items-center gap-3 cursor-pointer hover:bg-blue-50">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-blue-600">ใช้ตำแหน่งปัจจุบัน</p>
                            <p className="text-xs text-gray-400">ระบุพิกัด GPS ของคุณ</p>
                        </div>
                    </div>
                    
                    <div className="p-4">
                        <p className="text-xs font-bold text-gray-400 mb-2">หรือแตะเลือกบนแผนที่</p>
                        <LeafletMapPicker lat={initialLat} lng={initialLng} onSelectLocation={handleMapSelect} />
                        {value && (
                            <button onClick={() => setIsOpen(false)} className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-bold">
                                ยืนยันตำแหน่งนี้
                            </button>
                        )}
                    </div>
                </>
             )}

             {isSearching && <div className="p-4 text-center text-gray-400 flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> กำลังค้นหา...</div>}

             <div className="p-2">
                {searchResults.map((place, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelect({ name: place.display_name.split(',')[0], address: place.display_name, lat: parseFloat(place.lat), lng: parseFloat(place.lon) })}
                    className="bg-white p-3 rounded-xl border border-gray-100 mb-2 flex items-center gap-3 cursor-pointer hover:shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                       <MapPin className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-gray-800 truncate">{place.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{place.display_name}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
           <div className="p-2 text-center text-[10px] text-gray-300 bg-white">Map Data © OpenStreetMap contributors</div>
        </div>
      )}
    </>
  );
}

function PostJobScreen({ user, setView, userLocation, selectedCategory }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [timingType, setTimingType] = useState('immediate'); 
  const [workDate, setWorkDate] = useState('');
  const [workTime, setWorkTime] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);

  const category = selectedCategory || SERVICES[0]; 
  const isRouteService = category.type === 'route';
  const distance = (isRouteService && startLocation && endLocation) 
    ? getDistanceFromLatLonInKm(startLocation.lat, startLocation.lng, endLocation.lat, endLocation.lng)
    : 0;

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title || !budget) return;
    
    if (timingType === 'schedule' && (!workDate || !workTime)) {
      alert("กรุณาระบุวันและเวลา");
      return;
    }

    if (isRouteService && (!startLocation || !endLocation)) {
      alert("กรุณาระบุจุดรับและจุดส่งให้ครบถ้วน");
      return;
    }
    if (!isRouteService && !startLocation) { 
      alert("กรุณาระบุสถานที่ปฏิบัติงาน");
      return;
    }

    setSubmitting(true);
    try {
      const jobData = {
        employerId: user.uid,
        employerName: user.displayName || user.email,
        title, description: desc, budget: Number(budget),
        category: category.id, categoryType: category.type,
        timingType,
        workDate: timingType === 'immediate' ? 'ASAP' : workDate,
        workTime: timingType === 'immediate' ? 'ASAP' : workTime,
        contactPhone: phone,
        status: 'open', createdAt: serverTimestamp(),
        workerId: null, employerFinished: false, workerFinished: false
      };

      if (isRouteService) {
        jobData.startLocation = startLocation;
        jobData.endLocation = endLocation;
        jobData.distance = distance;
        jobData.location = startLocation; 
      } else {
        jobData.location = startLocation; 
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'), jobData);
      setSubmitting(false);
      setView('home');
    } catch (err) { console.error(err); setSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex items-center shadow-sm z-10 sticky top-0 bg-white">
         <button onClick={() => setView('home')} className="mr-3"><ChevronLeft className="text-gray-600"/></button>
         <h2 className="text-lg font-bold">สร้างภารกิจ: {category.name}</h2>
      </div>

      <div className="p-5 flex-1 overflow-y-auto bg-gray-50">
        <form onSubmit={handlePost} className="space-y-5">
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center mb-4 text-orange-600 font-bold border-b pb-2">
                <Briefcase className="w-4 h-4 mr-2" /> รายละเอียดงาน
             </div>
             
             <div className="mb-4">
                <label className={styles.label}>หัวข้อภารกิจ <span className="text-red-500">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={styles.input} placeholder={`เช่น ${category.name}ด่วน...`} required />
             </div>

             <div>
                <label className={styles.label}>รายละเอียดเพิ่มเติม</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} className={`${styles.input} h-24 resize-none`} placeholder="ระบุรายละเอียด..." />
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4 border-b pb-2">
               <div className="flex items-center text-orange-600 font-bold">
                  <MapPin className="w-4 h-4 mr-2" /> สถานที่
               </div>
               {isRouteService && distance > 0 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">
                    ระยะทาง ~{distance.toFixed(1)} กม.
                  </span>
               )}
             </div>

             {(startLocation || endLocation) && (
               <LeafletFormMap 
                  startLocation={startLocation}
                  endLocation={endLocation}
                  isRoute={isRouteService}
               />
             )}

             {isRouteService ? (
               <div className="relative mt-2">
                 <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-gray-200 border-l border-dashed border-gray-300 z-0"></div>
                 <LocationSelector label="ต้นทาง (จุดรับ)" placeholder="ระบุจุดรับ..." iconColor="text-green-600" value={startLocation} onChange={setStartLocation} userLocation={userLocation} />
                 <LocationSelector label="ปลายทาง (จุดส่ง)" placeholder="ระบุจุดส่ง..." iconColor="text-red-600" value={endLocation} onChange={setEndLocation} userLocation={userLocation} />
               </div>
             ) : (
               <LocationSelector label="สถานที่ปฏิบัติงาน" placeholder="ระบุสถานที่..." iconColor="text-blue-600" value={startLocation} onChange={setStartLocation} userLocation={userLocation} />
             )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center mb-4 text-orange-600 font-bold border-b pb-2">
                <Calendar className="w-4 h-4 mr-2" /> เวลาและติดต่อ
             </div>
             
             <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
               <button type="button" onClick={() => setTimingType('immediate')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${timingType === 'immediate' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>ทันที (ASAP)</button>
               <button type="button" onClick={() => setTimingType('schedule')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${timingType === 'schedule' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>จองล่วงหน้า</button>
             </div>

             {timingType === 'schedule' && (
               <div className="grid grid-cols-2 gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col"><label className={styles.label}>วันที่ <span className="text-red-500">*</span></label><input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className={styles.input} /></div>
                  <div className="flex flex-col"><label className={styles.label}>เวลา <span className="text-red-500">*</span></label><input type="time" value={workTime} onChange={e => setWorkTime(e.target.value)} className={styles.input} /></div>
               </div>
             )}

             <div>
                <label className={styles.label}>เบอร์ติดต่อ <span className="text-red-500">*</span></label>
                <div className="relative">
                   <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                   <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${styles.input} pl-10`} placeholder="08x-xxx-xxxx" required />
                </div>
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
               <label className="text-base font-bold text-gray-800">งบประมาณ (บาท)</label>
               <div className="w-1/2 relative">
                 <span className="absolute left-3 top-3 text-gray-500 font-bold">฿</span>
                 <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className={`${styles.input} pl-8 text-right font-bold text-lg text-orange-600`} placeholder="0" required />
               </div>
             </div>
          </div>

        </form>
      </div>
      <div className="p-4 border-t bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={handlePost} disabled={submitting} className={styles.buttonPrimary}>
          {submitting ? 'กำลังสร้างภารกิจ...' : 'ยืนยันสร้างภารกิจ'}
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ setUserData, setView }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'profile', 'info'), {
          displayName: name, email, phone, createdAt: serverTimestamp(), balance: 0, rating: 5.0
        });
        setUserData({ displayName: name, phone, email });
      }
      setView('home');
    } catch (err) { setError(err.message.includes('auth/') ? 'ข้อมูลไม่ถูกต้อง' : err.message); }
  };

  return (
    <div className="flex flex-col min-h-full bg-white relative justify-center px-8">
      <button onClick={() => setView('home')} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
      <div className="mb-10 text-center">
         <div className="inline-flex bg-gradient-to-br from-orange-400 to-red-500 p-5 rounded-3xl shadow-lg mb-6"><Zap className="w-12 h-12 text-white" /></div>
         <h1 className="text-2xl font-extrabold text-gray-800 mb-2">จ๊อบด่วน | Urgent Jobs</h1>
         <p className="text-sm text-gray-400 font-medium">จ๊อบด่วน จบงานเร็ว รับเงินทันที ~*</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && <input type="text" placeholder="ชื่อ-นามสกุล" className={styles.input} value={name} onChange={e => setName(e.target.value)} required />}
        {!isLogin && <input type="tel" placeholder="เบอร์โทรศัพท์" className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} required />}
        <input type="email" placeholder="อีเมล" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="รหัสผ่าน" className={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" className={styles.buttonPrimary}>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
      </form>
      <div className="mt-8 text-center text-sm"><button onClick={() => setIsLogin(!isLogin)} className="text-orange-600 font-bold">{isLogin ? 'สมัครสมาชิกใหม่' : 'เข้าสู่ระบบ'}</button></div>
    </div>
  );
}

function HomeScreen({ user, userLocation, setSelectedJob, setView, onCategoryClick }) {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'), where('status', '==', 'open'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const withDist = list.map(j => {
        const loc = j.location || j.startLocation;
        return { ...j, distance: (userLocation && loc) ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng) : null };
      });
      withDist.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
      setJobs(withDist);
    });
    return () => unsub();
  }, [userLocation]);

  return (
    <div className="p-5 pb-24">
      <div className="relative mb-6">
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} type="text" placeholder="ค้นหา..." className="w-full bg-white border pl-11 py-3 rounded-2xl shadow-sm outline-none" />
        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
      </div>
      <div className="mb-8">
        <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-orange-500" /> บริการของเรา</h2>
        <div className="grid grid-cols-4 gap-3">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => onCategoryClick(s)} className="flex flex-col items-center p-2 rounded-xl active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-sm ${s.color}`}>{React.cloneElement(s.icon, { size: 24 })}</div>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
      <h2 className="font-bold text-gray-800 text-lg mb-4">งานล่าสุด</h2>
      <div className="space-y-4">
        {jobs.filter(j => j.title.includes(searchTerm)).map(job => (
            <div key={job.id} onClick={() => { setSelectedJob(job); setView('job-detail'); }} className={styles.card}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex-1">
                     <h3 className="font-bold text-gray-800 line-clamp-1">{job.title}</h3>
                     {job.timingType === 'immediate' && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">ด่วน (ASAP)</span>}
                   </div>
                   <div className="bg-orange-50 px-2 py-1 rounded text-orange-600 font-bold text-sm">฿{job.budget}</div>
                </div>
                {job.categoryType === 'route' ? (
                   <div className="text-xs space-y-1 mt-2">
                      <div className="flex items-center text-gray-500"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div><span className="truncate max-w-[200px]">{job.startLocation?.name}</span></div>
                      <div className="flex items-center text-gray-500"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div><span className="truncate max-w-[200px]">{job.endLocation?.name}</span></div>
                   </div>
                ) : (
                   <div className="flex items-center text-xs text-gray-400 mt-2"><MapPin className="w-3 h-3 mr-1" /> {job.location?.name}</div>
                )}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}

function MyJobsScreen({ user, setView, setSelectedJob }) {
  const [activeTab, setActiveTab] = useState('hired');
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'));
    const unsub = onSnapshot(q, (snap) => {
       const all = snap.docs.map(d => ({id: d.id, ...d.data()}));
       setList(all.filter(j => activeTab === 'hired' ? j.employerId === user.uid : j.workerId === user.uid));
    });
    return () => unsub();
  }, [user, activeTab]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm z-10">
        <h2 className="text-xl font-bold mb-4">งานของฉัน</h2>
        <div className="flex border-b"><button onClick={() => setActiveTab('hired')} className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'hired' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}>ฉันจ้าง</button><button onClick={() => setActiveTab('working')} className={`flex-1 pb-3 text-sm font-bold ${activeTab === 'working' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}>ฉันทำ</button></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {list.map(job => (
          <div key={job.id} onClick={() => { setSelectedJob(job); setView('job-detail'); }} className={styles.card}>
            <div className="p-4 flex justify-between items-center">
              <div><h3 className="font-bold text-gray-800">{job.title}</h3><span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${job.status === 'open' ? 'bg-green-500' : job.status === 'completed' ? 'bg-gray-500' : job.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`}>{job.status === 'open' ? 'รอคนรับ' : job.status === 'cancelled' ? 'ยกเลิกแล้ว' : job.status === 'completed' ? 'สำเร็จ' : 'กำลังทำ'}</span></div>
              <ChevronLeft className="rotate-180 text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobDetailScreen({ user, job, setView, checkAuth, userData }) {
  const [currentJob, setCurrentJob] = useState(job);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null); // State for Person Popup
  const [employerPhoto, setEmployerPhoto] = useState(null);
  const [workerPhoto, setWorkerPhoto] = useState(null);
  
  const startLoc = currentJob.startLocation || currentJob.location;
  const endLoc = currentJob.endLocation;
  const isRoute = currentJob.categoryType === 'route';

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id), d => setCurrentJob({id: d.id, ...d.data()}));
    return () => unsub();
  }, [job.id]);

  useEffect(() => {
     if(showChat) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, s => setMessages(s.docs.map(d => d.data())));
        return () => unsub();
     }
  }, [job.id, showChat]);

  // Fetch photos
  useEffect(() => {
      const fetchPhoto = async (uid, setPhoto) => {
          if(!uid) return;
          const snap = await getDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'info'));
          if(snap.exists() && snap.data().photoBase64) setPhoto(snap.data().photoBase64);
      }
      fetchPhoto(currentJob.employerId, setEmployerPhoto);
      if(currentJob.workerId) fetchPhoto(currentJob.workerId, setWorkerPhoto);
  }, [currentJob.employerId, currentJob.workerId]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if(!inputMsg.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id, 'messages'), { text: inputMsg, senderId: user.uid, createdAt: serverTimestamp() });
    setInputMsg('');
  };

  const sendImage = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id, 'messages'), { 
              image: reader.result, 
              senderId: user.uid, 
              createdAt: serverTimestamp() 
          });
      };
      reader.readAsDataURL(file);
  };

  const handleAction = async (action) => {
     if(!user) return checkAuth();
     const ref = doc(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id);
     
     if(action === 'accept') {
         // Get current user photo to store in job for quicker access? Or just rely on ID.
         // Storing snapshots is better for history.
         await updateDoc(ref, { 
             status: 'in_progress', 
             workerId: user.uid, 
             workerName: userData?.displayName || user.email,
             workerPhone: userData?.phone || user.phoneNumber || '-', 
             acceptedAt: serverTimestamp() 
         });
     }
     if(action === 'cancel') await updateDoc(ref, { status: 'cancelled' });
     if(action === 'finish') {
        const isEmp = user.uid === currentJob.employerId;
        const update = isEmp ? { employerFinished: true } : { workerFinished: true };
        if (isEmp ? currentJob.workerFinished : currentJob.employerFinished) { update.status = 'completed'; }
        await updateDoc(ref, update);
     }
  };

  const handleNavigate = () => {
    let url = '';
    if (isRoute && startLoc && endLoc) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${startLoc.lat},${startLoc.lng}&destination=${endLoc.lat},${endLoc.lng}`;
    } else if (startLoc) {
      url = `https://www.google.com/maps/search/?api=1&query=${startLoc.lat},${startLoc.lng}`;
    }
    if (url) window.open(url, '_blank');
  };

  const openPersonPopup = (role) => {
      if (role === 'employer') {
          setSelectedPerson({
              name: currentJob.employerName,
              phone: currentJob.contactPhone,
              photo: employerPhoto,
              role: 'ผู้จ้าง'
          });
      } else if (role === 'worker' && currentJob.workerId) {
          setSelectedPerson({
              name: currentJob.workerName,
              phone: currentJob.workerPhone,
              photo: workerPhoto,
              role: 'ผู้รับงาน'
          });
      }
  };

  const isEmp = user && user.uid === currentJob.employerId;
  const isWkr = user && user.uid === currentJob.workerId;
  const isPart = isEmp || isWkr;

  return (
    <div className="flex flex-col h-full bg-white relative">
       <div className="bg-white px-4 py-3 border-b flex items-center justify-between shadow-sm z-10">
           <button onClick={() => setView(isPart ? 'my-jobs' : 'home')}><ChevronLeft /></button>
           <span className="font-bold">รายละเอียดงาน</span>
           <div/>
       </div>
       
       <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-24">
          {currentJob.status === 'cancelled' && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-center font-bold flex items-center justify-center"><XCircle className="w-5 h-5 mr-2"/> งานนี้ถูกยกเลิกแล้ว</div>}
          {currentJob.status === 'completed' && <div className="bg-green-100 text-green-600 p-3 rounded-xl mb-4 text-center font-bold flex items-center justify-center"><CheckCircle2 className="w-5 h-5 mr-2"/> งานเสร็จสิ้นแล้ว</div>}

          {/* Person Cards (Clickable) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
              <div onClick={() => openPersonPopup('employer')} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                  <p className="text-xs text-gray-400 mb-2 font-bold">ผู้จ้าง (Employer)</p>
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 overflow-hidden">
                          {employerPhoto ? <img src={employerPhoto} className="w-full h-full object-cover"/> : <UserCircle2 className="w-5 h-5"/>}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{currentJob.employerName}</p>
                          <p className="text-xs text-gray-500 truncate">{currentJob.contactPhone}</p>
                      </div>
                  </div>
              </div>
              {currentJob.workerId ? (
                  <div onClick={() => openPersonPopup('worker')} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                      <p className="text-xs text-gray-400 mb-2 font-bold">ผู้รับงาน (Worker)</p>
                      <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 text-orange-600 overflow-hidden">
                              {workerPhoto ? <img src={workerPhoto} className="w-full h-full object-cover"/> : <UserCircle2 className="w-5 h-5"/>}
                          </div>
                          <div className="overflow-hidden">
                              <p className="text-sm font-bold truncate">{currentJob.workerName}</p>
                              <p className="text-xs text-gray-500 truncate">{currentJob.workerPhone}</p>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-gray-100 p-3 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                      รอผู้รับงาน...
                  </div>
              )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm mb-4">
             <h1 className="text-xl font-bold mb-2">{currentJob.title}</h1>
             <div className="flex justify-between items-center mb-4">
                <span className="text-3xl font-bold text-orange-600">฿{currentJob.budget}</span>
                {currentJob.timingType === 'immediate' && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">ด่วนที่สุด (ASAP)</span>}
             </div>
             <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-xl">{currentJob.description}</p>
             
             {/* New Location Details & Navigation */}
             <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="font-bold text-gray-700 flex items-center"><MapPin className="w-4 h-4 mr-1"/> สถานที่</h3>
                    {isRoute && currentJob.distance && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold">ระยะทาง {currentJob.distance.toFixed(1)} กม.</span>}
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm space-y-3">
                    <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">{isRoute ? 'ต้นทาง (จุดรับ)' : 'สถานที่ปฏิบัติงาน'}</p>
                        <p className="font-medium text-gray-800">{startLoc?.name || 'ไม่ระบุชื่อสถานที'}</p>
                        <p className="text-xs text-gray-500 truncate">{startLoc?.address || 'ไม่ระบุที่อยู่'}</p>
                    </div>
                    
                    {isRoute && endLoc && (
                        <>
                            <div className="border-t border-gray-200"></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold mb-1">ปลายทาง (จุดส่ง)</p>
                                <p className="font-medium text-gray-800">{endLoc?.name || 'ไม่ระบุชื่อสถานที'}</p>
                                <p className="text-xs text-gray-500 truncate">{endLoc?.address || 'ไม่ระบุที่อยู่'}</p>
                            </div>
                        </>
                    )}

                    <button onClick={handleNavigate} className="w-full mt-2 bg-white border border-blue-200 text-blue-600 py-2 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm hover:bg-blue-50 transition">
                        <Navigation className="w-4 h-4 mr-2" /> เปิดนำทาง (Google Maps)
                    </button>
                </div>
             </div>

             {/* Map */}
             <div className="bg-gray-100 rounded-xl overflow-hidden mb-4 relative border border-gray-200 p-2">
                 <LeafletFormMap 
                    startLocation={currentJob.startLocation || currentJob.location} 
                    endLocation={currentJob.endLocation}
                    isRoute={currentJob.categoryType === 'route'}
                 />
             </div>

             <div className="space-y-2 pt-2 border-t border-gray-100">
                 <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>สร้างเมื่อ:</span>
                    <span>{formatDate(currentJob.createdAt)}</span>
                 </div>
                 {currentJob.acceptedAt && (
                     <div className="flex items-center justify-between text-xs text-green-600 font-medium">
                        <span>รับงานเมื่อ:</span>
                        <span>{formatDate(currentJob.acceptedAt)}</span>
                     </div>
                 )}
             </div>
          </div>
       </div>
       
       <div className="bg-white p-4 border-t absolute bottom-0 w-full flex flex-col gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          {currentJob.status === 'open' && (
              isEmp ? (
                  <button onClick={() => handleAction('cancel')} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold border border-red-100">ยกเลิกงานนี้</button>
              ) : (
                  <button onClick={() => handleAction('accept')} className={styles.buttonPrimary}>รับงานนี้ ({formatPrice(currentJob.budget)})</button>
              )
          )}

          {currentJob.status === 'in_progress' && isPart && (
              <div className="flex gap-2">
                  <button onClick={() => handleAction('cancel')} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">ยกเลิกงาน</button>
                  <button onClick={() => handleAction('finish')} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200">
                      {isEmp ? (currentJob.employerFinished ? 'รออีกฝ่ายยืนยัน' : 'ยืนยันจบงาน') : (currentJob.workerFinished ? 'รออีกฝ่ายยืนยัน' : 'แจ้งงานเสร็จสิ้น')}
                  </button>
              </div>
          )}
       </div>

       {isPart && currentJob.status !== 'cancelled' && (
           <button 
             onClick={() => setShowChat(true)}
             className="absolute bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-20"
           >
               <MessageSquare className="w-7 h-7" />
               {messages.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>}
           </button>
       )}

       {/* Chat Modal */}
       {showChat && (
           <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
               <div className="bg-white h-[80%] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                   <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                       <h3 className="font-bold text-gray-700 flex items-center"><MessageCircle className="w-5 h-5 mr-2 text-blue-600"/> ห้องสนทนา</h3>
                       <button onClick={() => setShowChat(false)} className="p-2 bg-white rounded-full shadow-sm"><X className="w-5 h-5"/></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                       {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">เริ่มพูดคุยกันได้เลย...</p>}
                       {messages.map((m, i) => (
                           <div key={i} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${m.senderId === user.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                   {m.image ? <img src={m.image} className="rounded-lg mb-1 max-w-full" /> : null}
                                   {m.text}
                               </div>
                           </div>
                       ))}
                   </div>
                   <form onSubmit={sendMsg} className="p-3 border-t bg-white flex gap-2 pb-6 items-center">
                       <label className="p-2 bg-gray-100 rounded-full text-gray-500 cursor-pointer hover:bg-gray-200">
                           <Camera className="w-5 h-5" />
                           <input type="file" accept="image/*" className="hidden" onChange={sendImage} />
                       </label>
                       <input autoFocus value={inputMsg} onChange={e => setInputMsg(e.target.value)} className="flex-1 bg-gray-100 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-100" placeholder="พิมพ์ข้อความ..."/>
                       <button type="submit" className="bg-blue-600 text-white p-3 rounded-full shadow-lg"><Send className="w-5 h-5"/></button>
                   </form>
               </div>
           </div>
       )}

       {/* Person Popup Modal */}
       {selectedPerson && (
           <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
               <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col items-center relative animate-in zoom-in-95 duration-200">
                   <button onClick={() => setSelectedPerson(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
                   
                   <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg mb-4 overflow-hidden flex items-center justify-center">
                       {selectedPerson.photo ? <img src={selectedPerson.photo} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-gray-400" />}
                   </div>
                   
                   <h3 className="text-xl font-bold text-gray-800 text-center">{selectedPerson.name}</h3>
                   <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full mt-2 font-bold">{selectedPerson.role}</span>
                   
                   <div className="mt-6 w-full space-y-3">
                       <a href={`tel:${selectedPerson.phone}`} className="flex items-center justify-center w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform">
                           <Phone className="w-5 h-5 mr-2" /> โทรหา ({selectedPerson.phone})
                       </a>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}

function ProfileScreen({ user, userData, setView, navigateTo }) {
    if (!user) return null;
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm mb-4 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-400 to-amber-500"></div>
                <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg z-10 mb-3 mt-8">
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                        {userData?.photoBase64 ? <img src={userData.photoBase64} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-gray-400" />}
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{userData?.displayName}</h2>
                <p className="text-sm text-gray-500">{userData?.email}</p>
            </div>

            <div className="px-4 space-y-3">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button onClick={() => navigateTo('profile-edit')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                        <div className="flex items-center"><UserCog className="w-5 h-5 text-gray-400 mr-3"/> <span className="text-sm font-medium">ข้อมูลของฉัน</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                    <button onClick={() => navigateTo('profile-notifications')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center"><BellRing className="w-5 h-5 text-gray-400 mr-3"/> <span className="text-sm font-medium">การแจ้งเตือน</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                </div>

                <button onClick={() => { signOut(auth); setView('home'); }} className="w-full bg-white rounded-xl p-4 text-red-500 font-bold flex items-center justify-center shadow-sm hover:bg-red-50 transition">
                    <LogOut className="w-5 h-5 mr-2" /> ออกจากระบบ
                </button>
            </div>
            <div className="mt-8 text-center text-xs text-gray-300">v10.0 (Popup, Photo Upload, Image Chat)</div>
        </div>
    );
}

function ProfileEditScreen({ user, userData, setView, setUserData }) {
    const [name, setName] = useState(userData?.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(userData?.photoBase64 || null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhoto(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = { displayName: name, photoBase64: photo };
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
            await updateDoc(userRef, updates);
            await updateProfile(user, { displayName: name }); // Auth profile photoURL has limit, usually skip for base64

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    alert('รหัสผ่านไม่ตรงกัน');
                    setLoading(false);
                    return;
                }
                await updatePassword(user, newPassword);
                alert('อัปเดตข้อมูลและรหัสผ่านเรียบร้อยแล้ว');
            } else {
                alert('อัปเดตข้อมูลเรียบร้อยแล้ว');
            }
            setUserData(prev => ({ ...prev, ...updates }));
            setView('profile');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-4 shadow-sm flex items-center">
                <button onClick={() => setView('profile')} className="mr-3"><ChevronLeft className="text-gray-600" /></button>
                <h2 className="text-lg font-bold">ข้อมูลของฉัน</h2>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer group">
                            <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                                {photo ? <img src={photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-400" />}
                            </div>
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">แตะเพื่อเปลี่ยนรูป</p>
                    </div>

                    <div>
                        <label className={styles.label}>ชื่อ-นามสกุล</label>
                        <input value={name} onChange={e => setName(e.target.value)} className={styles.input} />
                    </div>
                    <div>
                        <label className={styles.label}>เบอร์โทรศัพท์ <span className="text-xs text-gray-400 font-normal">(แก้ไขไม่ได้)</span></label>
                        <input value={userData?.phone || '-'} disabled className="w-full px-4 py-3 rounded-xl bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className={styles.label}>อีเมล <span className="text-xs text-gray-400 font-normal">(แก้ไขไม่ได้)</span></label>
                        <input value={userData?.email || '-'} disabled className="w-full px-4 py-3 rounded-xl bg-gray-200 border border-gray-300 text-gray-500 cursor-not-allowed" />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center"><Lock className="w-4 h-4 mr-2"/> เปลี่ยนรหัสผ่าน</h3>
                        <div className="space-y-3">
                            <input type="password" placeholder="รหัสผ่านใหม่ (ว่างไว้ถ้าไม่เปลี่ยน)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={styles.input} />
                            <input type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={styles.input} />
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className={styles.buttonPrimary}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function NotificationSettingsScreen({ setView }) {
    const isSupported = typeof Notification !== 'undefined';
    const [enabled, setEnabled] = useState(() => {
        if (isSupported) return Notification.permission === 'granted';
        return false;
    });

    const handleToggle = async () => {
        if (!isSupported) {
            alert("อุปกรณ์ของคุณไม่รองรับการแจ้งเตือน");
            return;
        }

        if (!enabled) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setEnabled(true);
                    new Notification("จ๊อบด่วน", { body: "เปิดการแจ้งเตือนเรียบร้อยแล้ว!" });
                } else {
                    alert('คุณปฏิเสธการแจ้งเตือน กรุณาเปิดในตั้งค่า Browser');
                }
            } catch (error) {
                console.error(error);
                setEnabled(true); 
            }
        } else {
            setEnabled(false); 
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-4 shadow-sm flex items-center">
                <button onClick={() => setView('profile')} className="mr-3"><ChevronLeft className="text-gray-600" /></button>
                <h2 className="text-lg font-bold">การแจ้งเตือน</h2>
            </div>
            <div className="p-5">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800">แจ้งเตือนสถานะงาน</h3>
                        <p className="text-xs text-gray-500">รับการแจ้งเตือนเมื่อมีคนรับงานหรือเมื่องานเสร็จสิ้น</p>
                    </div>
                    <button onClick={handleToggle} className="text-orange-500 focus:outline-none transition-transform active:scale-95">
                        {enabled ? <ToggleRight className="w-10 h-10 fill-current" /> : <ToggleLeft className="w-10 h-10 text-gray-300" />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                    หมายเหตุ: หากปิดการแจ้งเตือน คุณอาจพลาดการอัปเดตงานที่สำคัญ
                </p>
            </div>
        </div>
    );
}


