// Run this script to add more rooms to Firebase
// Execute with: npx ts-node scripts/seed-rooms.ts

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCBfxKrQaDN3a_pJzK-VScfn2TYd1Dk0LI",
  authDomain: "hotel-minima.firebaseapp.com",
  databaseURL: "https://hotel-minima-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-minima",
  storageBucket: "hotel-minima.firebasestorage.app",
  messagingSenderId: "1013644211804",
  appId: "1:1013644211804:web:b840672cfbe310b60c1899",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Additional rooms to add (different counts per type)
const additionalRooms = {
  // 4 more Standard Rooms (total will be 5)
  "room-standard-101": {
    type: "Standard Room",
    pricePerNight: 2000,
    capacity: 2,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
    description: "Comfortable room with modern amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767850837/hotel-rooms/qrsmnvg07tzavowsgb2v.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "room-standard-103": {
    type: "Standard Room",
    pricePerNight: 2000,
    capacity: 2,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
    description: "Comfortable room with modern amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767850837/hotel-rooms/qrsmnvg07tzavowsgb2v.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "room-standard-104": {
    type: "Standard Room",
    pricePerNight: 2000,
    capacity: 2,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
    description: "Comfortable room with modern amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767850837/hotel-rooms/qrsmnvg07tzavowsgb2v.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "room-standard-105": {
    type: "Standard Room",
    pricePerNight: 2000,
    capacity: 2,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
    description: "Comfortable room with modern amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767850837/hotel-rooms/qrsmnvg07tzavowsgb2v.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // 2 more Deluxe Rooms (total will be 3)
  "room-deluxe-202": {
    type: "Deluxe Room",
    pricePerNight: 10000,
    capacity: 4,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Bathtub"],
    description: "Spacious deluxe room with premium amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767849739/hotel-rooms/iiev1nwjypxzgkzgaoea.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  "room-deluxe-203": {
    type: "Deluxe Room",
    pricePerNight: 10000,
    capacity: 4,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Bathtub"],
    description: "Spacious deluxe room with premium amenities",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767849739/hotel-rooms/iiev1nwjypxzgkzgaoea.png",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // 1 more Executive Suite (total will be 2)
  "room-suite-302": {
    type: "Executive Suite",
    pricePerNight: 17500,
    capacity: 5,
    status: "available",
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar", "Bathtub", "Living Area", "Dining Area"],
    description: "Luxurious executive suite with panoramic views",
    imageUrl: "https://res.cloudinary.com/dwzj51834/image/upload/v1767849950/hotel-rooms/n7w1q32wqcuhrblyzsto.jpg",
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

async function seedRooms() {
  console.log("Adding rooms to Firebase...");
  
  for (const [roomId, roomData] of Object.entries(additionalRooms)) {
    const roomRef = ref(database, `rooms/${roomId}`);
    await set(roomRef, roomData);
    console.log(`Added: ${roomId} (${roomData.type})`);
  }
  
  console.log("\nDone! Room counts will be:");
  console.log("- Standard Room: 5 rooms");
  console.log("- Deluxe Room: 3 rooms");
  console.log("- Executive Suite: 2 rooms");
  console.log("- Grand Deluxe Twin Room: 1 room");
  console.log("- Junior Suite: 1 room");
  console.log("Total: 12 rooms");
  
  process.exit(0);
}

seedRooms().catch(console.error);
