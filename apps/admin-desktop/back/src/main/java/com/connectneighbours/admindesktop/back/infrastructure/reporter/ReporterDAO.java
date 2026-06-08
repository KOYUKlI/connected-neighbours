package com.connectneighbours.admindesktop.back.infrastructure.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReporterDAO extends JpaRepository<Reporter,UUID> {
    List<Reporter> findByFirstname(String firstname);
    List<Reporter> findByLastname(String lastname);
}
