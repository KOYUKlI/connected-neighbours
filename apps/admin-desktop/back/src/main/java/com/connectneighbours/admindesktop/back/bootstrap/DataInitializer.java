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
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            AlertRepository alertRepo,
            IncidentRepository incidentRepo,
            ReporterRepository reporterRepo
    ) {
        return args -> {

            if (incidentRepo.count() > 0) {
                return;
            }

            Reporter julie = reporterRepo.save(new Reporter("Julie", "M.", "/assets/default_avatar.png"));
            Reporter thomas = reporterRepo.save(new Reporter("Thomas", "L.", "/assets/default_avatar.png"));
            Reporter sarah = reporterRepo.save(new Reporter("Sarah", "D.", "/assets/default_avatar.png"));

            List<Incident> incidents = new ArrayList<>();

            incidents.add(incidentRepo.save(new Incident(julie, "Effraction local vélo", "Cadenas coupé retrouvé au sol",
                    IncidentType.SECURITY, IncidentSeverity.HIGH, LocalDateTime.now().minusDays(3))));

            incidents.add(incidentRepo.save(new Incident(thomas, "Vélo abandonné", "Vélo sans cadenas retrouvé",
                    IncidentType.NUISANCE, IncidentSeverity.LOW, LocalDateTime.now().minusDays(3))));

            incidents.add(incidentRepo.save(new Incident(julie, "Local mal entretenu", "Sol très sale",
                    IncidentType.CLEANLINESS, IncidentSeverity.MEDIUM, LocalDateTime.now().minusDays(2))));

            incidents.add(incidentRepo.save(new Incident(thomas, "Porte cassée", "Ne ferme plus correctement",
                    IncidentType.MAINTENANCE, IncidentSeverity.HIGH, LocalDateTime.now().minusDays(2))));

            incidents.add(incidentRepo.save(new Incident(julie, "Circulation difficile", "Couloir encombré",
                    IncidentType.TRAFFIC, IncidentSeverity.LOW, LocalDateTime.now().minusDays(2))));

            incidents.add(incidentRepo.save(new Incident(sarah, "Bruit suspect", "Bruit métallique",
                    IncidentType.OTHER, IncidentSeverity.LOW, LocalDateTime.now().minusDays(1))));

            incidents.add(incidentRepo.save(new Incident(julie, "Vol de vélo", "Un vélo a disparu",
                    IncidentType.SECURITY, IncidentSeverity.CRITICAL, LocalDateTime.now().minusDays(1))));

            incidents.add(incidentRepo.save(new Incident(thomas, "Déchets abandonnés", "Sacs poubelles au sol",
                    IncidentType.CLEANLINESS, IncidentSeverity.MEDIUM, LocalDateTime.now())));

            incidents.add(incidentRepo.save(new Incident(sarah, "Lampadaire défectueux", "Clignote en continu",
                    IncidentType.MAINTENANCE, IncidentSeverity.LOW, LocalDateTime.now())));

            Incident incidentWithFiveAlerts = incidentRepo.save(new Incident(
                    julie, "Intrusion suspecte", "Personne inconnue vue dans le local",
                    IncidentType.SECURITY, IncidentSeverity.HIGH, LocalDateTime.now()
            ));

            incidents.add(incidentWithFiveAlerts);

            for (Incident inc : incidents) {
                alertRepo.save(new Alert(inc, julie, "Observation", "Détail signalé", AlertSeverity.LOW));
                alertRepo.save(new Alert(inc, thomas, "Analyse", "Vérification effectuée", AlertSeverity.MEDIUM));
                alertRepo.save(new Alert(inc, sarah, "Confirmation", "Signalement validé", AlertSeverity.HIGH));
            }

            alertRepo.save(new Alert(incidentWithFiveAlerts, julie, "Caméra obstruée", "Caméra bloquée 10s", AlertSeverity.MEDIUM));
            alertRepo.save(new Alert(incidentWithFiveAlerts, thomas, "Badge inconnu", "Tentative d'accès", AlertSeverity.CRITICAL));
        };
    }
}





