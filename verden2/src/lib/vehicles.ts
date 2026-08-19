export type Vehicle = {
  id: string;
  name: string;
  description: string;
};

export const VEHICLES: Vehicle[] = [
  { id: "sedan.glb", name: "Sedan", description: "Standard sedan for daily commute" },
  { id: "sedan-sports.glb", name: "Sports Sedan", description: "High-performance sports sedan" },
  { id: "suv.glb", name: "SUV", description: "Reliable mid-size family SUV" },
  { id: "suv-luxury.glb", name: "Luxury SUV", description: "Premium luxury off-road SUV" },
  { id: "hatchback-sports.glb", name: "Hatchback", description: "Sporty and agile hot hatch" },
  { id: "race.glb", name: "Race Car", description: "Track-focused high-speed racer" },
  { id: "race-future.glb", name: "Future Race Car", description: "Next-gen electric hypercar" },
  { id: "taxi.glb", name: "Taxi", description: "Classic metropolitan taxi cruiser" },
  { id: "police.glb", name: "Police Car", description: "Highway patrol responder car" },
  { id: "ambulance.glb", name: "Ambulance", description: "Emergency medical transport van" },
  { id: "firetruck.glb", name: "Fire Truck", description: "Heavy-duty urban fire engine" },
  {
    id: "garbage-truck.glb",
    name: "Garbage Truck",
    description: "Essential community sanitation truck",
  },
  { id: "delivery.glb", name: "Delivery Truck", description: "High-roof package delivery vehicle" },
  {
    id: "delivery-flat.glb",
    name: "Flatbed Truck",
    description: "Utility commercial transport truck",
  },
  { id: "van.glb", name: "Van", description: "Spacious multi-passenger van" },
  { id: "truck.glb", name: "Pickup Truck", description: "Fully electric workhorse pickup truck" },
  { id: "truck-flat.glb", name: "Semi Truck", description: "Heavy long-haul commercial transport" },
  { id: "tractor.glb", name: "Tractor", description: "Heavy-duty agricultural tractor" },
  {
    id: "tractor-shovel.glb",
    name: "Excavator",
    description: "Industrial construction crawler shovel",
  },
  {
    id: "tractor-police.glb",
    name: "Police Riot Bulldozer",
    description: "Tactical obstacle clearing vehicle",
  },
  {
    id: "kart-oobi.glb",
    name: "Standard Go-Kart",
    description: "High-acceleration mini track kart",
  },
  { id: "kart-oodi.glb", name: "Turbo Go-Kart", description: "Super light agile mini kart" },
  {
    id: "kart-ooli.glb",
    name: "Cruiser Go-Kart",
    description: "High-grip off-road adventure kart",
  },
  {
    id: "kart-oopi.glb",
    name: "Classic Go-Kart",
    description: "Nostalgic retro style racing kart",
  },
  { id: "kart-oozi.glb", name: "Entry Go-Kart", description: "Default entry-level racing go-kart" },
  { id: "box.glb", name: "Mystery Box", description: "Mysterious shipping crate token" },
];

export const DEFAULT_CAR_ID = "sedan.glb";

// 8 extra premium vehicles unlocked for Malav Patel
export const MALAV_FREE_CARS = [
  "sedan-sports.glb", // Sports Sedan
  "suv-luxury.glb", // Luxury SUV
  "race-future.glb", // Future Race Car
  "police.glb", // Police Car
  "truck.glb", // Pickup Truck
  "kart-oobi.glb", // Standard Go-Kart
  "kart-oodi.glb", // Turbo Go-Kart
  "tractor.glb", // Tractor
];
