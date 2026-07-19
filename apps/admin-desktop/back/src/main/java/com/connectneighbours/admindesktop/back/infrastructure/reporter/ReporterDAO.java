package com.connectneighbours.admindesktop.back.infrastructure.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReporterDAO extends JpaRepository<Reporter, UUID> {
    List<Reporter> findByFirstname(String firstname);

    List<Reporter> findByLastname(String lastname);

    Optional<Reporter> findByFirstnameAndLastname(String firstname, String lastname);

    List<Reporter> findByRole(ReporterRole role);

    Optional<Reporter> findByEmail(String email);
}
