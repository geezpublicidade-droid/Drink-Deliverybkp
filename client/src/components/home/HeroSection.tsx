import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import heroVideo from '@assets/ciroc_1765072919532.mp4';

export function HeroSection() {
  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden" data-testid="section-hero">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        data-testid="video-hero"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      <div className="hero-overlay absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-4 gold-text-gradient"
          data-testid="text-hero-title"
        >
          VIBE DRINKS
        </h1>
        <p 
          className="font-serif text-xl md:text-2xl text-white/90 mb-2"
          data-testid="text-hero-subtitle"
        >
          Adega & Drinkeria
        </p>
        <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl">
          As melhores bebidas premium com entrega rapida para voce
        </p>

        <Button
          size="lg"
          className="bg-primary text-primary-foreground font-semibold px-8 py-6 text-lg gold-glow"
          onClick={scrollToProducts}
          data-testid="button-hero-cta"
        >
          Ver Cardapio
        </Button>

        <button 
          onClick={scrollToProducts}
          className="absolute bottom-8 animate-bounce text-primary"
          aria-label="Scroll para produtos"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </div>
    </section>
  );
}
