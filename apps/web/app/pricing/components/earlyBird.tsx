import Marquee from "react-fast-marquee";

export function EarlyBirdBanner() {
    return (
        <div className="bg-primary text-white px-4 py-2 text-center mb-4">
           <Marquee>
                <p className="text-sm">🚀 Early Bird Special: Sign up now and get 50% off your first 3 months with code <span className="font-bold text-accent">EARLYBIRD26</span> Limited time offer. Don't miss out! 🚀</p>
            </Marquee>
        </div>
    );
}