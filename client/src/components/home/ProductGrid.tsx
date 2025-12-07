import { useState } from 'react';
import { Search, LayoutList, Grid2X2, LayoutGrid, Wine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@shared/schema';

type GridColumns = 1 | 2 | 4;

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  selectedCategory: string | null;
}

export function ProductGrid({ products, isLoading, selectedCategory }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gridColumns, setGridColumns] = useState<GridColumns>(2);

  const getGridClasses = () => {
    switch (gridColumns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-2 sm:grid-cols-4';
    }
  };

  const filteredProducts = products.filter(product => {
    if (!product.isActive) return false;
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="products-section" className="py-8 px-4" data-testid="section-products">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">
            Produtos
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-1">
              <Button
                size="icon"
                variant={gridColumns === 1 ? 'default' : 'ghost'}
                onClick={() => setGridColumns(1)}
                className="h-8 w-8"
                data-testid="button-grid-1"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={gridColumns === 2 ? 'default' : 'ghost'}
                onClick={() => setGridColumns(2)}
                className="h-8 w-8"
                data-testid="button-grid-2"
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={gridColumns === 4 ? 'default' : 'ghost'}
                onClick={() => setGridColumns(4)}
                className="h-8 w-8"
                data-testid="button-grid-4"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-primary/30 focus:border-primary text-white placeholder:text-muted-foreground"
                data-testid="input-search-products"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`grid ${getGridClasses()} gap-6`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="h-16 w-16 mx-auto mb-4 text-primary/50" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `Nao encontramos resultados para "${searchQuery}"`
                : 'Nenhum produto disponivel nesta categoria'
              }
            </p>
          </div>
        ) : (
          <div className={`grid ${getGridClasses()} gap-6`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
