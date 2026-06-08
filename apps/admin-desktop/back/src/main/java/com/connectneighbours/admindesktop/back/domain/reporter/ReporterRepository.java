package com.connectneighbours.admindesktop.back.domain.reporter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReporterRepository {
    Reporter save(Reporter reporter);
    Optional<Reporter> findById(UUID reporterId);
    List<Reporter> findAll();
    Page<Reporter> findAll(Pageable pageable);
    List<Reporter> findByFirstname(String firstname);
    List<Reporter> findByLastname(String lastname);
    void delete(Reporter reporter);
}
