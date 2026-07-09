package com.connectneighbours.admindesktop.back.bootstrap;

import com.connectneighbours.admindesktop.back.domain.alert.Alert;
import com.connectneighbours.admindesktop.back.domain.alert.AlertRepository;
import com.connectneighbours.admindesktop.back.domain.alert.AlertSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.Incident;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentRepository;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentSeverity;
import com.connectneighbours.admindesktop.back.domain.incident.IncidentType;
import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            AlertRepository alertRepo,
            IncidentRepository incidentRepo,
            ReporterRepository reporterRepo
    ) {
        return args -> {
            Reporter julie = reporterRepo.save(
                    new Reporter("Julie", "M.", "/assets/default_avatar.png")
            );

            Reporter thomas = reporterRepo.save(
                    new Reporter("Thomas", "L.", "/assets/default_avatar.png")
            );

            Reporter sarah = reporterRepo.save(
                    new Reporter("Sarah", "D.", "/assets/default_avatar.png")
            );


            Incident incident1 = incidentRepo.save(
                    new Incident(
                            julie,
                            "Effraction local vélo",
                            "Cadenas coupé retrouvé au sol",
                            IncidentType.SECURITY,
                            IncidentSeverity.HIGH
                    )
            );

            Incident incident2 = incidentRepo.save(
                    new Incident(
                            thomas,
                            "Vélo abandonné",
                            "Un vélo sans cadenas retrouvé dans le local",
                            IncidentType.NUISANCE,
                            IncidentSeverity.LOW
                    )
            );

            Incident incident3 = incidentRepo.save(
                    new Incident(
                            sarah,
                            "Tentative d'effraction",
                            "Poignée de porte forcée, traces suspectes",
                            IncidentType.SECURITY,
                            IncidentSeverity.MEDIUM
                    )
            );


            Incident incident4 = incidentRepo.save(new Incident(
                    julie,
                    "Suspicion de sabotage dans la salle électrique",
                    "Des anomalies ont été détectées dans le tableau électrique, suggérant une possible manipulation.",
                    IncidentType.MAINTENANCE,
                    IncidentSeverity.HIGH
            ));

            Incident incident5 = incidentRepo.save(new Incident(
                    thomas,
                    "Activité suspecte dans le dépôt de matériel",
                    "Plusieurs éléments indiquent une intrusion ou une manipulation non autorisée dans le dépôt.",
                    IncidentType.SECURITY,
                    IncidentSeverity.CRITICAL
            ));

            Incident incident6 = incidentRepo.save(new Incident(
                    julie,
                    "Dépôt sauvage de déchets",
                    "Des sacs poubelles ont été abandonnés près de l’entrée du parking.",
                    IncidentType.CLEANLINESS,
                    IncidentSeverity.MEDIUM
            ));

            Incident incident7 = incidentRepo.save(new Incident(
                    thomas,
                    "Lampadaire défectueux",
                    "Un lampadaire clignote en continu depuis plusieurs jours.",
                    IncidentType.MAINTENANCE,
                    IncidentSeverity.LOW
            ));

            Incident incident8 = incidentRepo.save(new Incident(
                    sarah,
                    "Embouteillage inhabituel",
                    "Un bouchon s’est formé devant la résidence à cause d’un véhicule mal stationné.",
                    IncidentType.TRAFFIC,
                    IncidentSeverity.MEDIUM
            ));

            Incident incident9 = incidentRepo.save(new Incident(
                    julie,
                    "Signalement d’odeur suspecte",
                    "Une odeur étrange a été détectée dans le hall, sans cause identifiée.",
                    IncidentType.OTHER,
                    IncidentSeverity.LOW
            ));

            Incident incident10 = incidentRepo.save(new Incident(
                    thomas,
                    "Dégradation des espaces verts",
                    "Des branches cassées et des détritus retrouvés dans le jardin commun.",
                    IncidentType.CLEANLINESS,
                    IncidentSeverity.MEDIUM
            ));




            alertRepo.save(new Alert(
                    incident1,
                    julie,
                    "Cadenas coupé retrouvé au sol",
                    "Le cadenas a été retrouvé au sol, probablement coupé.",
                    AlertSeverity.CRITICAL
            ));

            alertRepo.save(new Alert(
                    incident1,
                    thomas,
                    "Présence de traces suspectes",
                    "Des marques de frottement sur la porte du local.",
                    AlertSeverity.HIGH
            ));

            alertRepo.save(new Alert(
                    incident1,
                    sarah,
                    "Suspicion de repérage",
                    "Un individu inconnu observé près du local à plusieurs reprises.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident1,
                    julie,
                    "Bruit métallique entendu",
                    "Un bruit de métal a été entendu dans le local vers 23h.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident1,
                    thomas,
                    "Poignée légèrement tordue",
                    "La poignée du local semble avoir été forcée récemment.",
                    AlertSeverity.HIGH
            ));

            alertRepo.save(new Alert(
                    incident1,
                    sarah,
                    "Caméra extérieure brièvement désactivée",
                    "La caméra de surveillance a cessé de transmettre pendant environ 30 secondes.",
                    AlertSeverity.MEDIUM
            ));


            alertRepo.save(new Alert(
                    incident2,
                    thomas,
                    "Vélo abandonné dans le local",
                    "Un vélo sans cadenas retrouvé dans le local.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident2,
                    julie,
                    "Fenêtre arrière légèrement ouverte",
                    "La fenêtre du local informatique était entrouverte alors qu’elle est normalement verrouillée.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident2,
                    thomas,
                    "Câble réseau débranché",
                    "Un câble Ethernet principal a été débranché sans justification.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident2,
                    sarah,
                    "Présence d’empreintes suspectes",
                    "Des empreintes de chaussures inconnues ont été trouvées près de la porte arrière.",
                    AlertSeverity.HIGH
            ));


            alertRepo.save(new Alert(
                    incident3,
                    sarah,
                    "Suspicion de tentative d'effraction",
                    "Poignée de porte forcée, traces suspectes.",
                    AlertSeverity.HIGH
            ));

            alertRepo.save(new Alert(
                    incident3,
                    thomas,
                    "Badge non reconnu utilisé",
                    "Un badge inconnu a tenté d’accéder au parking à 02h14.",
                    AlertSeverity.HIGH
            ));

            alertRepo.save(new Alert(
                    incident3,
                    sarah,
                    "Caméra obstruée",
                    "La caméra du portail a été recouverte pendant quelques secondes.",
                    AlertSeverity.CRITICAL
            ));

            alertRepo.save(new Alert(
                    incident3,
                    julie,
                    "Voiture suspecte stationnée",
                    "Un véhicule non enregistré est resté 15 minutes devant l’entrée.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident3,
                    thomas,
                    "Gravillons déplacés",
                    "Des traces de pas ont été observées près du grillage latéral.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident4,
                    sarah,
                    "Disjoncteur déclenché",
                    "Un disjoncteur a sauté sans raison apparente.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident4,
                    julie,
                    "Odeur de brûlé",
                    "Une légère odeur de plastique brûlé a été détectée près du tableau électrique.",
                    AlertSeverity.HIGH
            ));

            alertRepo.save(new Alert(
                    incident5,
                    thomas,
                    "Casier forcé",
                    "Un casier de stockage a été ouvert de force.",
                    AlertSeverity.CRITICAL
            ));

            alertRepo.save(new Alert(
                    incident5,
                    sarah,
                    "Inventaire incomplet",
                    "Un outil enregistré dans l’inventaire manque.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident5,
                    julie,
                    "Bruit inhabituel",
                    "Un bruit métallique a été entendu dans le dépôt vers 01h.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident6,
                    julie,
                    "Sacs éventrés",
                    "Certains sacs ont été ouverts, laissant des déchets au sol.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident6,
                    sarah,
                    "Caméra obstruée",
                    "La caméra donnant sur le parking était recouverte de poussière.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident7,
                    thomas,
                    "Clignotement constant",
                    "Le lampadaire clignote toutes les 3 secondes.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident7,
                    julie,
                    "Risque de court-circuit",
                    "Une odeur de chaud a été brièvement détectée.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident8,
                    sarah,
                    "Stationnement gênant",
                    "Un véhicule bloque partiellement l’accès au parking.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident8,
                    thomas,
                    "Klaxons répétés",
                    "Plusieurs résidents ont signalé des nuisances sonores.",
                    AlertSeverity.LOW
            ));


            alertRepo.save(new Alert(
                    incident9,
                    julie,
                    "Odeur persistante",
                    "L’odeur est revenue le lendemain matin.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident9,
                    sarah,
                    "Ventilation suspecte",
                    "Le système de ventilation semble faire un bruit inhabituel.",
                    AlertSeverity.MEDIUM
            ));


            alertRepo.save(new Alert(
                    incident10,
                    thomas,
                    "Branches cassées",
                    "Plusieurs branches ont été retrouvées au sol.",
                    AlertSeverity.LOW
            ));

            alertRepo.save(new Alert(
                    incident10,
                    julie,
                    "Déchets dispersés",
                    "Des papiers et emballages traînent dans les buissons.",
                    AlertSeverity.MEDIUM
            ));


        };
    }

    @PostConstruct
    public void debugInit() {
        System.out.println(">>> DataInitializer running in = " + this);
    }
}
