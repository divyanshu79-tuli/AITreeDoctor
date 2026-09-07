export interface SampleLeaf {
  id: string;
  name: string;
  condition: string;
  category: 'Fruit' | 'Crop' | 'Medicinal' | 'Ornamental' | 'Tree';
  imageUrl: string;
  description: string;
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-mango-powdery',
    name: 'Mango Tree',
    condition: 'Powdery Mildew Fungus',
    category: 'Fruit',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=800&q=80',
    description: 'Mango leaves showing white powdery fungal patches, leaf distortion, and blighting of tender shoots.'
  },
  {
    id: 'sample-tomato-blight',
    name: 'Tomato Plant',
    condition: 'Early Blight (Alternaria solani)',
    category: 'Crop',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
    description: 'Tomato leaf exhibiting concentric brown bullseye rings with yellow chlorotic halos.'
  },
  {
    id: 'sample-neem-healthy',
    name: 'Neem Tree',
    condition: 'Healthy Botanical Foliage',
    category: 'Medicinal',
    imageUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80',
    description: 'Deep green, serrated, vibrant healthy neem leaves rich in azadirachtin.'
  },
  {
    id: 'sample-citrus-iron',
    name: 'Lemon / Citrus Tree',
    condition: 'Iron & Zinc Chlorosis',
    category: 'Fruit',
    imageUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=800&q=80',
    description: 'Lemon leaf with interveinal yellowing where leaf veins remain green while blades turn yellow.'
  },
  {
    id: 'sample-cotton-curl',
    name: 'Cotton Crop',
    condition: 'Leaf Curl Virus (CLCuV)',
    category: 'Crop',
    imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=80',
    description: 'Upward curling and thickening of cotton leaf veins transmitted by whiteflies.'
  },
  {
    id: 'sample-rose-blackspot',
    name: 'Rose Plant',
    condition: 'Black Spot Fungus (Diplocarpon rosae)',
    category: 'Ornamental',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
    description: 'Circular dark black/purple spots on upper leaf surfaces causing premature leaf drop.'
  }
];
