import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductImage(imageUrl?: string, category?: string, name?: string): string {
  if (imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('placeholder.jpg')) {
    return imageUrl.replace(/^\/public/, '');
  }

  const categoryLower = (category || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (categoryLower === 'pizza') {
    if (nameLower.includes('margherita')) return '/images/products/margherita.jpg';
    if (nameLower.includes('farmhouse')) return '/images/products/farmhouse.jpg';
    if (nameLower.includes('supreme')) return '/images/products/veg-supreme.jpg';
    if (nameLower.includes('pepperoni')) return '/images/products/pepperoni.jpg';
    if (nameLower.includes('tikka') || nameLower.includes('paneer'))
      return '/images/products/paneer-tikka.jpg';
    return '/images/products/margherita.jpg';
  }

  if (categoryLower === 'sides') {
    if (nameLower.includes('bread') && nameLower.includes('stuffed'))
      return '/images/products/garlic-bread-stuffed.jpg';
    if (nameLower.includes('bread')) return '/images/products/garlic-bread.jpg';
    if (nameLower.includes('fries')) return '/images/products/french-fries.jpg';
    return '/images/products/garlic-bread.jpg';
  }

  if (categoryLower === 'drinks') {
    if (nameLower.includes('coke')) return '/images/products/coke.jpg';
    if (nameLower.includes('pepsi')) return '/images/products/pepsi.jpg';
    if (nameLower.includes('sprite')) return '/images/products/sprite.jpg';
    if (nameLower.includes('water')) return '/images/products/water.jpg';
    return '/images/products/pepsi.jpg';
  }

  if (categoryLower === 'desserts') {
    if (nameLower.includes('lava') || nameLower.includes('choco'))
      return '/images/products/choco-lava.jpg';
    if (nameLower.includes('brownie')) return '/images/products/brownie.jpg';
    if (nameLower.includes('cheesecake')) return '/images/products/cheesecake.jpg';
    return '/images/products/brownie.jpg';
  }

  if (categoryLower === 'combos') {
    if (nameLower.includes('2') || nameLower.includes('double'))
      return '/images/products/combo-2.jpg';
    if (nameLower.includes('feast') || nameLower.includes('family'))
      return '/images/products/combo-3.jpg';
    return '/images/products/combo-1.jpg';
  }

  return '/images/product-placeholder.jpg';
}
