import Image from 'next/image';

interface ItemImageProps {
    itemId: string;
    itemName: string;
    size?: number;
    className?: string;
}

export default function ItemImage({ itemId, itemName, size = 32, className = '' }: ItemImageProps) {
    // Map internal recipe IDs to WarEra image filenames if necessary
    // Assuming mostly direct mapping for now
    // For camelCase IDs like lightAmmo, we might need to verify if it's light_ammo.png or lightAmmo.png
    // Let's assume direct mapping first based on user input.

    const imageSrc = `https://app.warera.io/images/items/${itemId}.png?v=31`;

    return (
        <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
            <Image
                src={imageSrc}
                alt={itemName}
                width={size}
                height={size}
                className="object-contain"
                unoptimized // Sometimes external game assets have issues with optimization, but we'll see
            />
        </div>
    );
}
