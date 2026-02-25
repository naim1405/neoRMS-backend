export interface ICreateRestaurant {
    name: string;
    tagline?: string;
    description?: string;
    location?: string;
    contactInfo?: string;
    bannerImage?: string;
}

export interface IUpdateRestaurant {
    name?: string;
    tagline?: string;
    description?: string;
    location?: string;
    contactInfo?: string;
    bannerImage?: string;
}
