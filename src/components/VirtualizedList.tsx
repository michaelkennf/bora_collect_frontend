import React, { useState, useEffect } from 'react';

// Import conditionnel de react-window avec fallback
let FixedSizeList: any = null;

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Composant de liste virtualisée réutilisable
 * Utilise react-window si disponible, sinon rendu normal
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 60,
  height = 600,
  className = '',
  fallbackClassName = 'space-y-2'
}: VirtualizedListProps<T>) {
  const [isVirtualized, setIsVirtualized] = useState(false);

  useEffect(() => {
    // Charger react-window de manière asynchrone
    if (typeof window !== 'undefined' && !FixedSizeList) {
      import('react-window')
        .then((reactWindow) => {
          FixedSizeList = reactWindow.FixedSizeList;
          setIsVirtualized(true);
        })
        .catch(() => {
          // react-window non disponible
          setIsVirtualized(false);
        });
    } else if (FixedSizeList) {
      setIsVirtualized(true);
    }
  }, []);

  // Si react-window n'est pas disponible, utiliser le rendu normal
  if (!isVirtualized || !FixedSizeList) {
    return (
      <div className={fallbackClassName}>
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Virtualisation avec react-window
  return (
    <div className={className} style={{ height }}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        itemData={items}
      >
        {({ index, style, data }: { index: number; style: React.CSSProperties; data: T[] }) => (
          <div style={style}>
            {renderItem(data[index], index)}
          </div>
        )}
      </FixedSizeList>
    </div>
  );
}

