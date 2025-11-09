import freteGratisBanner from "@/assets/promotions/frete-gratis-banner.jpg";

export const PromotionsCarousel = () => {
  return (
    <div className="relative w-full">
      <div className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
        <img 
          src={freteGratisBanner}
          alt="Frete Grátis para novos usuários - Use o cupom TAURIFRETEOFF"
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};
