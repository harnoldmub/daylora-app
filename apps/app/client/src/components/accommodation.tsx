
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Train, Plane, Car } from "lucide-react";

type Hotel = {
    name: string;
    location: string;
    distHall: string; // Distance to Dobbelenbergstraat 107
    distMidi?: string; // Distance to Brussels-Midi
    distAirport?: string; // Distance to Airport
    link: string;
    platform?: string;
};

const airportHotels: Hotel[] = [
    {
        name: "Van der Valk Hotel Brussels Airport",
        location: "Aéroport de Bruxelles / Diegem",
        distHall: "~ 10–15 min (voiture)",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/van-der-valk-brussels-airport.fr.html",
        platform: "Booking.com",
    },
    {
        name: "Holiday Inn Express Brussels Airport",
        location: "Proche Brussels Airport, Diegem",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/holiday-inn-express-brussels-airport.fr.html",
    },
    {
        name: "NH Brussels Airport",
        location: "Périphérie aéroport / Diegem",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/nh-brussels-airport.fr.html",
    },
    {
        name: "Park Inn by Radisson Brussels Airport",
        location: "Zone proche de l’aéroport / périphérie",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/park-inn-brussels-airport.fr.html",
    },
    {
        name: "Pentahotel Brussels Airport",
        location: "Proche Brussels Airport / Diegem",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/pentahotel-brussels-airport.fr.html",
    },
    {
        name: "Aparthotel Adagio Access Brussels Airport",
        location: "Zone périphérie aéroport",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/adagio-access-brussels-airport.fr.html",
    },
    {
        name: "Holiday Inn Brussels Airport",
        location: "Près de l’aéroport / périphérie",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/holiday-inn-brussels-airport.fr.html",
    },
    {
        name: "Sheraton Brussels Airport Hotel",
        location: "Proche Brussels Airport / Diegem",
        distHall: "~ 10–15 min",
        distAirport: "< 2 min (face au terminal)",
        link: "https://www.booking.com/hotel/be/sheraton-brussels-airport.fr.html",
    },
    {
        name: "ibis Budget Brussels Airport",
        location: "Zone aéroport / périphérie",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/ibis-budget-brussels-airport.fr.html",
    },
    {
        name: "Hilton Garden Inn Brussels Airport",
        location: "Aéroport / périphérie",
        distHall: "~ 10–15 min",
        distAirport: "~ 5 min",
        link: "https://www.booking.com/hotel/be/hilton-garden-inn-brussels-airport.fr.html",
    },
];

const midiHotels: Hotel[] = [
    {
        name: "MEININGER Hotel Bruxelles Gare du Midi",
        location: "Bara 67‑69, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min (300m)",
        link: "https://www.booking.com/hotel/be/meininger-brussels-gare-du-midi.fr.html",
        platform: "Booking.com",
    },
    {
        name: "ibis Brussels Centre Gare Midi",
        location: "Rue de France / Saint‑Gilles, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min (50m)",
        link: "https://www.booking.com/hotel/be/ibis-brussels-centre-gare-midi.fr.html",
    },
    {
        name: "Radisson Hotel Brussels Centre Midi",
        location: "Place Marcel Broodthaers 3, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min (Face gare)",
        link: "https://www.booking.com/hotel/be/park-inn-brussels-midi.fr.html",
    },
    {
        name: "Mercure Brussels Centre Midi",
        location: "Boulevard Jamar 25‑29, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min",
        link: "https://www.booking.com/hotel/be/mercure-brussels-centre-midi.fr.html",
    },
    {
        name: "Pullman Brussels Centre Midi",
        location: "Quartier Saint‑Gilles / gare Midi, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min (Dans la gare)",
        link: "https://www.booking.com/hotel/be/pullman-brussels-midi.fr.html",
    },
    {
        name: "Novotel Brussels Centre Midi Station",
        location: "Saint‑Gilles / proche gare, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min",
        link: "https://www.booking.com/hotel/be/novotel-brussels-centre-midi-station.fr.html",
    },
    {
        name: "B&B HOTEL Brussels Centre Gare du Midi",
        location: "Avenue Fonsny 10, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min",
        link: "https://www.booking.com/hotel/be/b-amp-b-brussels-centre-gare-du-midi.fr.html",
    },
    {
        name: "YOOMA Urban Lodge Brussels",
        location: "Quartier Saint‑Gilles / proche Midi, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min",
        link: "https://www.booking.com/hotel/be/yooma-urban-lodge-brussels.fr.html",
    },
    {
        name: "Urban Yard Hotel",
        location: "Bruxelles (zone centre / Anderlecht‑Midi)",
        distHall: "~ 20–30 min",
        distMidi: "~ 5–10 min",
        link: "https://www.booking.com/hotel/be/urban-yard.fr.html",
    },
    {
        name: "Hotel Midi‑Zuid",
        location: "Saint‑Gilles / proche gare, Bruxelles",
        distHall: "~ 20–30 min",
        distMidi: "~ < 5 min",
        link: "https://www.booking.com/hotel/be/midi-zuid.fr.html",
    },
];

function HotelCard({ hotel }: { hotel: Hotel }) {
    return (
        <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif font-medium leading-tight">
                    {hotel.name}
                </CardTitle>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{hotel.location}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                    <Car className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium text-xs uppercase tracking-wide opacity-70">
                        Vers la Salle :
                    </span>
                    <span className="ml-auto">{hotel.distHall}</span>
                </div>

                {hotel.distMidi && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                        <Train className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium text-xs uppercase tracking-wide opacity-70">
                            Vers Gare Midi :
                        </span>
                        <span className="ml-auto truncate max-w-[150px]" title={hotel.distMidi}>
                            {hotel.distMidi}
                        </span>
                    </div>
                )}

                {hotel.distAirport && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/20">
                        <Plane className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium text-xs uppercase tracking-wide opacity-70">
                            Vers Aéroport :
                        </span>
                        <span className="ml-auto truncate max-w-[150px]" title={hotel.distAirport}>
                            {hotel.distAirport}
                        </span>
                    </div>
                )}

                <div className="pt-2">
                    <a
                        href={hotel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                    >
                        <Badge variant="outline" className="w-full justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer py-1.5">
                            Voir sur {hotel.platform || "Booking.com"}
                        </Badge>
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

export function AccommodationSection() {
    return (
        <section id="accommodation" className="py-24 md:py-32 lg:py-40 px-6 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-foreground tracking-wide">
                        HÉBERGEMENTS SUGGÉRÉS
                    </h2>
                    <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
                        Nous avons sélectionné pour vous plusieurs hôtels situés stratégiquement
                        près de la gare ou de la salle pour faciliter votre séjour.
                    </p>
                </div>

                <Tabs defaultValue="midi" className="w-full">
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                            <TabsTrigger value="midi" className="font-serif">
                                Zone Gare du Midi
                            </TabsTrigger>
                            <TabsTrigger value="airport" className="font-serif">
                                Proche de la Salle
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="midi" className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {midiHotels.map((hotel, idx) => (
                                <HotelCard key={idx} hotel={hotel} />
                            ))}
                        </div>
                        <p className="text-center text-sm text-muted-foreground italic mt-8">
                            * Ces hôtels sont idéals si vous arrivez en train à Bruxelles-Midi.
                        </p>
                    </TabsContent>

                    <TabsContent value="airport" className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {airportHotels.map((hotel, idx) => (
                                <HotelCard key={idx} hotel={hotel} />
                            ))}
                        </div>
                        <p className="text-center text-sm text-muted-foreground italic mt-8">
                            * Ces hôtels sont pratiques si vous arrivez par avion ou préférez être en périphérie.
                        </p>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
