import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithCustomToken
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
  Clock, PlusCircle, LogOut, Bell, Navigation, 
  X, Zap, ChevronLeft, Search, ShieldCheck, Package, Users, ShoppingBag, Utensils, 
  SprayCan, Truck, Wrench, Grid, Calendar, Phone,
  Home, Eye, Car, Shirt, Plane, Monitor, Shield, 
  Dumbbell, Gamepad2, PawPrint, HeartHandshake, Key,
  Loader2, Camera, Siren, CheckCircle2, XCircle, UserCircle2, Lock, UserCog, BellRing, ToggleLeft, ToggleRight
} from 'lucide-react';

// --- Google Maps Imports ---
import { GoogleMap, LoadScript, Autocomplete, Marker, DirectionsRenderer } from '@react-google-maps/api';

// --- Configs ---
// ⚠️ ใส่ Google Maps API Key ของคุณที่นี่
const GOOGLE_MAPS_API_KEY = "AIzaSyDDaHsGPK7R9iUjFVydwOqnn7AcYiuMjso"; 
const LIBRARIES = ['places'];

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
  { id: 'transport', name: 'รับ-ส่ง คน', icon: <Car />, color: 'bg-blue-100 text-blue-600', type: 'route' },
  { id: 'driver', name: 'คนขับรถ', icon: <Key />, color: 'bg-indigo-100 text-indigo-600', type: 'route' },
  { id: 'messenger', name: 'รับส่งของ', icon: <Package />, color: 'bg-sky-100 text-sky-600', type: 'route' },
  { id: 'move', name: 'ช่วยขนย้าย', icon: <Truck />, color: 'bg-amber-100 text-amber-600', type: 'route' },
  { id: 'maid', name: 'หาแม่บ้าน', icon: <Home />, color: 'bg-rose-100 text-rose-600', type: 'single' },
  { id: 'laundry', name: 'ฝากซักผ้า', icon: <Shirt />, color: 'bg-cyan-100 text-cyan-600', type: 'route' },
  { id: 'clean', name: 'ทำความสะอาด', icon: <SprayCan />, color: 'bg-teal-100 text-teal-600', type: 'single' },
  { id: 'pet_care', name: 'ดูแลสัตว์เลี้ยง', icon: <PawPrint />, color: 'bg-orange-100 text-orange-600', type: 'single' }, 
  { id: 'elder_care', name: 'ดูแลผู้สูงอายุ', icon: <HeartHandshake />, color: 'bg-red-100 text-red-600', type: 'single' }, 
  { id: 'bodyguard', name: 'บอดี้การ์ด', icon: <Shield />, color: 'bg-slate-100 text-slate-600', type: 'single' },
  { id: 'shopping', name: 'ฝากซื้อของ', icon: <ShoppingBag />, color: 'bg-green-100 text-green-600', type: 'route' },
  { id: 'food', name: 'ซื้ออาหาร', icon: <Utensils />, color: 'bg-lime-100 text-lime-600', type: 'route' },
  { id: 'queue', name: 'ต่อคิว', icon: <Users />, color: 'bg-purple-100 text-purple-600', type: 'single' },
  { id: 'travel_buddy', name: 'หาเพื่อนเที่ยว', icon: <Plane />, color: 'bg-pink-100 text-pink-600', type: 'single' },
  { id: 'sport_buddy', name: 'เพื่อนเล่นกีฬา', icon: <Dumbbell />, color: 'bg-emerald-100 text-emerald-600', type: 'single' },
  { id: 'game_buddy', name: 'คนเล่นเกมส์', icon: <Gamepad2 />, color: 'bg-violet-100 text-violet-600', type: 'single' },
  { id: 'it_tech', name: 'ช่างไอที', icon: <Monitor />, color: 'bg-blue-50 text-blue-800', type: 'single' },
  { id: 'detective', name: 'หานักสืบ', icon: <Eye />, color: 'bg-gray-100 text-gray-800', type: 'single' },
  { id: 'fix', name: 'งานช่าง', icon: <Wrench />, color: 'bg-yellow-100 text-yellow-600', type: 'single' },
  { id: 'general', name: 'งานทั่วไป', icon: <Grid />, color: 'bg-fuchsia-100 text-fuchsia-600', type: 'single' },
];

// --- Utility Functions ---
const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(price);
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// --- Google Maps Components ---

// 1. Map Picker (with Autocomplete)
const GoogleMapPicker = ({ lat, lng, onSelectLocation, placeholder }) => {
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [markerPos, setMarkerPos] = useState(lat && lng ? { lat, lng } : { lat: 13.7563, lng: 100.5018 }); // Default Bangkok

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onAutocompleteLoad = (autoC) => {
    setAutocomplete(autoC);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMarkerPos(newPos);
        map.panTo(newPos);
        map.setZoom(15);
        if (onSelectLocation) {
          onSelectLocation(newPos.lat, newPos.lng, place.name, place.formatted_address);
        }
      }
    }
  };

  const onMapClick = (e) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPos(newPos);
    // Reverse geocoding usually happens on backend or via Geocoding API (costly). 
    // Here we just pass coords and a generic name.
    if (onSelectLocation) {
      onSelectLocation(newPos.lat, newPos.lng, "ตำแหน่งที่เลือกบนแผนที่", `Lat: ${newPos.lat.toFixed(5)}, Lng: ${newPos.lng.toFixed(5)}`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
           <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={placeholder || "ค้นหาสถานที่..."}
                className="bg-transparent border-none outline-none w-full text-sm"
              />
           </div>
        </Autocomplete>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 h-48">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={markerPos}
          zoom={13}
          onLoad={onLoad}
          onClick={onMapClick}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          <Marker position={markerPos} />
        </GoogleMap>
      </div>
    </div>
  );
};

// 2. Map Route View (Directions)
const GoogleRouteMap = ({ startLocation, endLocation, isRoute, onDistanceCalculated }) => {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (isRoute && startLocation && endLocation) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: startLocation.lat, lng: startLocation.lng },
          destination: { lat: endLocation.lat, lng: endLocation.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            if (onDistanceCalculated) {
              // Extract distance in km text or value
              const distText = result.routes[0].legs[0].distance.text;
              const distValue = result.routes[0].legs[0].distance.value / 1000; // km
              onDistanceCalculated(distValue);
            }
          } else {
            console.error(`error fetching directions ${result}`);
          }
        }
      );
    }
  }, [startLocation, endLocation, isRoute]);

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 mt-2 bg-gray-50">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={startLocation ? { lat: startLocation.lat, lng: startLocation.lng } : { lat: 13.7563, lng: 100.5018 }}
        zoom={12}
        options={{ disableDefaultUI: true }}
      >
        {!isRoute && startLocation && <Marker position={{ lat: startLocation.lat, lng: startLocation.lng }} />}
        
        {isRoute && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#2563eb",
                strokeWeight: 5,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

// --- Main App Component ---
export default function UrgentJobsApp() {
  // Wrap entire app in LoadScript to ensure Google API is ready everywhere
  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
      <AppContent />
    </LoadScript>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [userLocation, setUserLocation] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestActionName, setGuestActionName] = useState('');
  const [newJobAlert, setNewJobAlert] = useState(null);

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

  // Real-time Notification Logic
  useEffect(() => {
    if (!user || !userLocation) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const job = { id: change.doc.id, ...change.doc.data() };
                const now = new Date();
                const jobTime = job.createdAt?.toDate ? job.createdAt.toDate() : new Date();
                if ((now - jobTime) / 60000 > 5) return; // Ignore old jobs
                if (job.employerId === user.uid) return;

                const loc = job.startLocation || job.location;
                // Simple distance check (Haversine) - faster than API
                if (loc) {
                    const R = 6371; 
                    const dLat = (loc.lat - userLocation.lat) * (Math.PI / 180);
                    const dLon = (loc.lng - userLocation.lng) * (Math.PI / 180);
                    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(userLocation.lat*Math.PI/180)*Math.cos(loc.lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const dist = R * c;

                    if (dist <= 8) {
                        setNewJobAlert({ ...job, distance: dist });
                        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    }
                }
            }
        });
    });
    return () => unsubscribe();
  }, [user, userLocation]);

  // Styles
  const styles = {
    primaryGradient: "bg-gradient-to-r from-orange-500 to-amber-500",
    card: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
    input: "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all",
    label: "text-sm font-bold text-gray-700 mb-1 block",
    buttonPrimary: "w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl active:scale-95 transition-all",
    buttonSecondary: "w-full bg-white text-gray-700 font-bold py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
  };

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
        {view === 'auth' && <AuthScreen setUserData={setUserData} setView={setView} styles={styles} />}
        {view === 'home' && <HomeScreen user={user} onCategoryClick={handleCategoryClick} userLocation={userLocation} setSelectedJob={setSelectedJob} setView={setView} styles={styles} />}
        {view === 'post' && <PostJobScreen user={user} setView={setView} userLocation={userLocation} selectedCategory={selectedCategory} userData={userData} styles={styles} />}
        {view === 'my-jobs' && <MyJobsScreen user={user} setView={setView} setSelectedJob={setSelectedJob} styles={styles} />}
        {view === 'profile' && <ProfileScreen user={user} userData={userData} setView={setView} navigateTo={navigateTo} styles={styles} />}
        {view === 'profile-edit' && <ProfileEditScreen user={user} userData={userData} setView={setView} setUserData={setUserData} styles={styles} />}
        {view === 'profile-notifications' && <NotificationSettingsScreen setView={setView} />}
        {view === 'job-detail' && <JobDetailScreen user={user} job={selectedJob} setView={setView} checkAuth={() => navigateTo('auth', 'รับงานนี้')} userData={userData} styles={styles} />}
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

      {/* Alert Popup */}
      {newJobAlert && (
          <div className="absolute top-4 left-4 right-4 z-[70] bg-white rounded-2xl shadow-2xl border-l-4 border-orange-500 p-4 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center text-orange-600 font-bold">
                      <Siren className="w-5 h-5 mr-2 animate-pulse" /> งานด่วนใกล้คุณ!
                  </div>
                  <button onClick={() => setNewJobAlert(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{newJobAlert.title}</h3>
              <div className="flex items-center justify-between text-sm mb-3 bg-gray-50 p-2 rounded-lg">
                  <div className="font-bold text-green-600">฿{newJobAlert.budget}</div>
                  <div className="flex items-center text-gray-500 text-xs">
                      <MapPin className="w-3 h-3 mr-1" /> ห่าง {newJobAlert.distance.toFixed(1)} กม.
                  </div>
              </div>
              <button 
                onClick={() => { setSelectedJob(newJobAlert); setView('job-detail'); setNewJobAlert(null); }}
                className="w-full bg-orange-500 text-white py-2 rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 transition"
              >
                  ดูรายละเอียด / รับงาน
              </button>
          </div>
      )}

      {/* Guest Modal */}
      {showGuestModal && (
        <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center mb-4"><div className="bg-orange-100 p-4 rounded-full"><ShieldCheck className="w-10 h-10 text-orange-500" /></div></div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h3>
            <p className="text-center text-gray-500 mb-6 text-sm">คุณต้องเป็นสมาชิกเพื่อ <span className="text-orange-600 font-bold">"{guestActionName}"</span></p>
            <div className="space-y-3">
              <button onClick={() => { setShowGuestModal(false); setView('auth'); }} className={styles.buttonPrimary}>เข้าสู่ระบบ / สมัครสมาชิก</button>
              <button onClick={() => setShowGuestModal(false)} className={styles.buttonSecondary}>ไว้คราวหลัง</button>
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
        <div className={`w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200 ring-4 ring-white transition-transform active:scale-90`}>
          {React.cloneElement(icon, { size: 28, className: "text-white" })}
        </div>
        <span className="text-[10px] font-bold text-gray-500 absolute -bottom-4 left-1/2 -translate-x-1/2 w-max">{label}</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 w-16 py-1 rounded-xl transition-all ${active ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// --- Screens ---

function PostJobScreen({ user, setView, userLocation, selectedCategory, userData, styles }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [timingType, setTimingType] = useState('immediate'); 
  const [workDate, setWorkDate] = useState('');
  const [workTime, setWorkTime] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [submitting, setSubmitting] = useState(false);
  
  // Location States
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [distance, setDistance] = useState(0);

  const category = selectedCategory || SERVICES[0]; 
  const isRouteService = category.type === 'route';

  const handleLocationSelect = (type, lat, lng, name, address) => {
    const loc = { lat, lng, name, address };
    if (type === 'start') setStartLocation(loc);
    else setEndLocation(loc);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title || !budget) return;
    if (timingType === 'schedule' && (!workDate || !workTime)) { alert("กรุณาระบุวันและเวลา"); return; }
    if (isRouteService && (!startLocation || !endLocation)) { alert("กรุณาระบุจุดรับและจุดส่ง"); return; }
    if (!isRouteService && !startLocation) { alert("กรุณาระบุสถานที่"); return; }

    setSubmitting(true);
    try {
      const jobData = {
        employerId: user.uid,
        employerName: userData?.displayName || user.email, // ใช้นามสมมติ/ชื่อจริง
        title, description: desc, budget: Number(budget),
        category: category.id, categoryType: category.type,
        timingType,
        workDate: timingType === 'immediate' ? 'ASAP' : workDate,
        workTime: timingType === 'immediate' ? 'ASAP' : workTime,
        contactPhone: phone,
        status: 'open', createdAt: serverTimestamp(),
        workerId: null
      };

      if (isRouteService) {
        jobData.startLocation = startLocation;
        jobData.endLocation = endLocation;
        jobData.distance = distance; // Distance from Google API callback
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
               <div className="flex items-center text-orange-600 font-bold"><MapPin className="w-4 h-4 mr-2" /> สถานที่</div>
               {distance > 0 && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">ระยะทาง ~{distance.toFixed(1)} กม.</span>}
             </div>

             {(startLocation || endLocation) && (
               <GoogleRouteMap 
                  startLocation={startLocation}
                  endLocation={endLocation}
                  isRoute={isRouteService}
                  onDistanceCalculated={setDistance}
               />
             )}

             {isRouteService ? (
               <div className="relative mt-4 space-y-4">
                 <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 border-l border-dashed border-gray-300 z-0"></div>
                 <div className="relative z-10 pl-10">
                    <p className="text-xs font-bold text-gray-500 mb-1">จุดรับ (ต้นทาง)</p>
                    <GoogleMapPicker lat={userLocation?.lat} lng={userLocation?.lng} onSelectLocation={(lat, lng, name, addr) => handleLocationSelect('start', lat, lng, name, addr)} placeholder="ค้นหาจุดรับ..." />
                 </div>
                 <div className="relative z-10 pl-10">
                    <p className="text-xs font-bold text-gray-500 mb-1">จุดส่ง (ปลายทาง)</p>
                    <GoogleMapPicker lat={userLocation?.lat} lng={userLocation?.lng} onSelectLocation={(lat, lng, name, addr) => handleLocationSelect('end', lat, lng, name, addr)} placeholder="ค้นหาจุดส่ง..." />
                 </div>
               </div>
             ) : (
                <div className="mt-2">
                   <GoogleMapPicker lat={userLocation?.lat} lng={userLocation?.lng} onSelectLocation={(lat, lng, name, addr) => handleLocationSelect('start', lat, lng, name, addr)} placeholder="ค้นหาสถานที่ปฏิบัติงาน..." />
                </div>
             )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
               <button type="button" onClick={() => setTimingType('immediate')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${timingType === 'immediate' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>ทันที (ASAP)</button>
               <button type="button" onClick={() => setTimingType('schedule')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${timingType === 'schedule' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>จองล่วงหน้า</button>
             </div>
             {timingType === 'schedule' && (
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col"><label className={styles.label}>วันที่</label><input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className={styles.input} /></div>
                  <div className="flex flex-col"><label className={styles.label}>เวลา</label><input type="time" value={workTime} onChange={e => setWorkTime(e.target.value)} className={styles.input} /></div>
               </div>
             )}
             <div>
                <label className={styles.label}>เบอร์ติดต่อ</label>
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
      <div className="p-4 border-t bg-white shadow-lg">
        <button onClick={handlePost} disabled={submitting} className={styles.buttonPrimary}>
          {submitting ? 'กำลังสร้างภารกิจ...' : 'ยืนยันสร้างภารกิจ'}
        </button>
      </div>
    </div>
  );
}

function JobDetailScreen({ user, job, setView, checkAuth, userData, styles }) {
  const [currentJob, setCurrentJob] = useState(job);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
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
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id, 'messages'), { image: reader.result, senderId: user.uid, createdAt: serverTimestamp() });
      };
      reader.readAsDataURL(file);
  };

  const handleAction = async (action) => {
     if(!user) return checkAuth();
     const ref = doc(db, 'artifacts', appId, 'public', 'data', 'jobs', job.id);
     
     if(action === 'accept') {
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
    if (isRoute && startLoc && endLoc) url = `https://www.google.com/maps/dir/?api=1&origin=${startLoc.lat},${startLoc.lng}&destination=${endLoc.lat},${endLoc.lng}`;
    else if (startLoc) url = `https://www.google.com/maps/search/?api=1&query=${startLoc.lat},${startLoc.lng}`;
    if (url) window.open(url, '_blank');
  };

  const openPersonPopup = (role) => {
      if (role === 'employer') {
          setSelectedPerson({ name: currentJob.employerName, phone: currentJob.contactPhone, photo: employerPhoto, role: 'ผู้จ้าง' });
      } else if (role === 'worker' && currentJob.workerId) {
          setSelectedPerson({ name: currentJob.workerName, phone: currentJob.workerPhone, photo: workerPhoto, role: 'ผู้รับงาน' });
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

          {/* Person Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
              <div onClick={() => openPersonPopup('employer')} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform">
                  <p className="text-xs text-gray-400 mb-2 font-bold">ผู้จ้าง (Employer)</p>
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 overflow-hidden">
                          {employerPhoto ? <img src={employerPhoto} className="w-full h-full object-cover"/> : <UserCircle2 className="w-5 h-5"/>}
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{currentJob.employerName}</p>
                          <p className="text-xs text-gray-500 truncate">กดดูข้อมูล</p>
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
                              <p className="text-xs text-gray-500 truncate">กดดูข้อมูล</p>
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
             
             {/* Location & Navigation */}
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
                 <GoogleRouteMap startLocation={startLoc} endLocation={endLoc} isRoute={isRoute} />
             </div>

             <div className="space-y-2 pt-2 border-t border-gray-100">
                 <div className="flex items-center justify-between text-xs text-gray-500"><span>สร้างเมื่อ:</span><span>{formatDate(currentJob.createdAt)}</span></div>
                 {currentJob.acceptedAt && <div className="flex items-center justify-between text-xs text-green-600 font-medium"><span>รับงานเมื่อ:</span><span>{formatDate(currentJob.acceptedAt)}</span></div>}
             </div>
          </div>
       </div>
       
       <div className="bg-white p-4 border-t absolute bottom-0 w-full flex flex-col gap-2 shadow-lg">
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
           <button onClick={() => setShowChat(true)} className="absolute bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-20">
               <MessageSquare className="w-7 h-7" />
               {messages.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>}
           </button>
       )}

       {showChat && (
           <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
               <div className="bg-white h-[80%] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                   <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
                       <h3 className="font-bold text-gray-700 flex items-center"><MessageCircle className="w-5 h-5 mr-2 text-blue-600"/> ห้องสนทนา</h3>
                       <button onClick={() => setShowChat(false)} className="p-2 bg-white rounded-full shadow-sm"><X className="w-5 h-5"/></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                       {messages.map((m, i) => (
                           <div key={i} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${m.senderId === user.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                   {m.image ? <img src={m.image} className="rounded-lg mb-1 max-w-full" /> : null}{m.text}
                               </div>
                           </div>
                       ))}
                   </div>
                   <form onSubmit={sendMsg} className="p-3 border-t bg-white flex gap-2 pb-6 items-center">
                       <label className="p-2 bg-gray-100 rounded-full text-gray-500 cursor-pointer hover:bg-gray-200"><Camera className="w-5 h-5" /><input type="file" accept="image/*" className="hidden" onChange={sendImage} /></label>
                       <input autoFocus value={inputMsg} onChange={e => setInputMsg(e.target.value)} className="flex-1 bg-gray-100 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-100" placeholder="พิมพ์ข้อความ..."/>
                       <button type="submit" className="bg-blue-600 text-white p-3 rounded-full shadow-lg"><Send className="w-5 h-5"/></button>
                   </form>
               </div>
           </div>
       )}

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

// ... (Rest of components: ProfileScreen, ProfileEditScreen, NotificationSettingsScreen - Standard) ...
function ProfileScreen({ user, userData, setView, navigateTo, styles }) {
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
                        <div className="flex items-center"><UserCog className="w-5 h-5 text-gray-400 mr-3"/> <span className="text-sm font-medium">ข้อมูลของฉัน</span></div><ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                    <button onClick={() => navigateTo('profile-notifications')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center"><BellRing className="w-5 h-5 text-gray-400 mr-3"/> <span className="text-sm font-medium">การแจ้งเตือน</span></div><ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                </div>
                <button onClick={() => { signOut(auth); setView('home'); }} className="w-full bg-white rounded-xl p-4 text-red-500 font-bold flex items-center justify-center shadow-sm hover:bg-red-50 transition">
                    <LogOut className="w-5 h-5 mr-2" /> ออกจากระบบ
                </button>
            </div>
            <div className="mt-8 text-center text-xs text-gray-300">v10.1 (Maps + Alerts)</div>
        </div>
    );
}

function ProfileEditScreen({ user, userData, setView, setUserData, styles }) {
    const [name, setName] = useState(userData?.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(userData?.photoBase64 || null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setPhoto(reader.result); };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = { displayName: name, photoBase64: photo };
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
            await updateDoc(userRef, updates);
            await updateProfile(user, { displayName: name });
            if (newPassword) {
                if (newPassword !== confirmPassword) { alert('รหัสผ่านไม่ตรงกัน'); setLoading(false); return; }
                await updatePassword(user, newPassword);
            }
            setUserData(prev => ({ ...prev, ...updates }));
            setView('profile');
        } catch (error) { console.error(error); alert('Error: ' + error.message); }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-4 shadow-sm flex items-center"><button onClick={() => setView('profile')} className="mr-3"><ChevronLeft className="text-gray-600" /></button><h2 className="text-lg font-bold">ข้อมูลของฉัน</h2></div>
            <div className="p-5 flex-1 overflow-y-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer group">
                            <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                                {photo ? <img src={photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-400" />}
                            </div>
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white w-8 h-8" /></div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                    <div><label className={styles.label}>ชื่อ-นามสกุล</label><input value={name} onChange={e => setName(e.target.value)} className={styles.input} /></div>
                    <div className="pt-4 border-t border-gray-200"><h3 className="font-bold text-gray-700 mb-3 flex items-center"><Lock className="w-4 h-4 mr-2"/> เปลี่ยนรหัสผ่าน</h3><div className="space-y-3"><input type="password" placeholder="รหัสผ่านใหม่" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={styles.input} /><input type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={styles.input} /></div></div>
                    <button disabled={loading} type="submit" className={styles.buttonPrimary}>{loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</button>
                </form>
            </div>
        </div>
    );
}

function NotificationSettingsScreen({ setView }) {
    const isSupported = typeof Notification !== 'undefined';
    const [enabled, setEnabled] = useState(() => isSupported && Notification.permission === 'granted');
    const handleToggle = async () => {
        if (!isSupported) { alert("อุปกรณ์ไม่รองรับ"); return; }
        if (!enabled) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') { setEnabled(true); new Notification("จ๊อบด่วน", { body: "เปิดการแจ้งเตือนแล้ว!" }); }
            } catch (error) { console.error(error); setEnabled(true); }
        } else { setEnabled(false); }
    };
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-4 shadow-sm flex items-center"><button onClick={() => setView('profile')} className="mr-3"><ChevronLeft className="text-gray-600" /></button><h2 className="text-lg font-bold">การแจ้งเตือน</h2></div>
            <div className="p-5"><div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"><div><h3 className="font-bold text-gray-800">แจ้งเตือนสถานะงาน</h3></div><button onClick={handleToggle} className="text-orange-500">{enabled ? <ToggleRight className="w-10 h-10 fill-current" /> : <ToggleLeft className="w-10 h-10 text-gray-300" />}</button></div></div>
        </div>
    );
}


