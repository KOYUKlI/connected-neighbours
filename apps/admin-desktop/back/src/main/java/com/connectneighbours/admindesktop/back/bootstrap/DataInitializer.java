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
                    incident2,
                    thomas,
                    "Vélo abandonné dans le local",
                    "Un vélo sans cadenas retrouvé dans le local.",
                    AlertSeverity.MEDIUM
            ));

            alertRepo.save(new Alert(
                    incident3,
                    sarah,
                    "Suspicion de tentative d'effraction",
                    "Poignée de porte forcée, traces suspectes.",
                    AlertSeverity.HIGH
            ));

        };
    }

    @PostConstruct
    public void debugInit() {
        System.out.println(">>> DataInitializer running in = " + this);
    }
}
