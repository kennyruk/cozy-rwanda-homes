import kicukiro from "../assets/property-kicukiro.jpg";
import kimihurura from "../assets/property-kimihurura.jpg";
import musanze from "../assets/property-musanze.jpg";

export type Property = {
  id: string;
  title: string;
  location: string;
  district: string;
  type: string;
  price: number;
  beds: number;
  baths: number;
  image: string;
  available: boolean;
  verified: boolean;
  description: string;
  amenities: string[];
};

export const properties: Property[] = [
  {
    id: "kicukiro-courtyard",
    title: "Modern 2 Bedroom Apartment",
    location: "Nyarugunga, Kicukiro",
    district: "Kicukiro",
    type: "Apartment",
    price: 350000,
    beds: 2,
    baths: 2,
    image: kicukiro,
    available: true,
    verified: true,
    description: "A calm, light-filled home in a secure courtyard, close to everyday shops and key routes into central Kigali.",
    amenities: ["Parking", "Water tank", "Fibre internet", "24h security"],
  },
  {
    id: "kimihurura-view",
    title: "Hillside Apartment with City View",
    location: "Kimihurura, Gasabo",
    district: "Gasabo",
    type: "Apartment",
    price: 650000,
    beds: 3,
    baths: 2,
    image: kimihurura,
    available: true,
    verified: true,
    description: "A thoughtfully furnished apartment with broad Kigali views, generous living spaces and excellent natural light.",
    amenities: ["Furnished", "Balcony", "Parking", "Backup power"],
  },
  {
    id: "musanze-garden",
    title: "Quiet Garden Home",
    location: "Muhoza, Musanze",
    district: "Musanze",
    type: "House",
    price: 480000,
    beds: 3,
    baths: 2,
    image: musanze,
    available: true,
    verified: false,
    description: "A well-kept family home with a private garden and mountain air, within easy reach of central Musanze.",
    amenities: ["Private garden", "Parking", "Hot water", "Pet friendly"],
  },
  {
    id: "remera-studio",
    title: "Bright Studio near Remera",
    location: "Remera, Gasabo",
    district: "Gasabo",
    type: "Room",
    price: 220000,
    beds: 1,
    baths: 1,
    image: kimihurura,
    available: true,
    verified: false,
    description: "A practical, bright studio for one person, close to transport, cafés and the stadium.",
    amenities: ["Furnished", "Wi-Fi", "Hot water"],
  },
  {
    id: "nyarutarama-townhouse",
    title: "Family Townhouse in Nyarutarama",
    location: "Nyarutarama, Gasabo",
    district: "Gasabo",
    type: "House",
    price: 900000,
    beds: 4,
    baths: 3,
    image: kicukiro,
    available: true,
    verified: true,
    description: "A spacious family townhouse in a peaceful, connected neighbourhood with a private outdoor area.",
    amenities: ["Garden", "Parking", "Staff quarters", "Security"],
  },
  {
    id: "huye-family-home",
    title: "Comfortable Home near Campus",
    location: "Ngoma, Huye",
    district: "Huye",
    type: "House",
    price: 300000,
    beds: 3,
    baths: 2,
    image: musanze,
    available: false,
    verified: true,
    description: "A comfortable home with flexible rooms, a green garden and convenient access to Huye town.",
    amenities: ["Garden", "Water tank", "Parking"],
  },
];

export const formatPrice = (price: number) => new Intl.NumberFormat("en-RW").format(price);