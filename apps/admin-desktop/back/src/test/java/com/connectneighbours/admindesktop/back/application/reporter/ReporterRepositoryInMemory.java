package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.*;

public class ReporterRepositoryInMemory implements ReporterRepository {
    private final Map<UUID, Reporter> data = new HashMap<>();

    @Override
    public Reporter save(Reporter reporter) {
        data.put(reporter.getIdReporter(), reporter);
        return reporter;
    }

    @Override
    public Optional<Reporter> findById(UUID reporterId) {
        return Optional.ofNullable(data.get(reporterId));
    }

    @Override
    public List<Reporter> findAll() {
        return new ArrayList<>(data.values());
    }

    @Override
    public Page<Reporter> findAll(Pageable pageable) {
        var content = findAll(pageable.getPageNumber(), pageable.getPageSize());
        return new PageImpl<>(content, pageable, data.size());
    }

    public List<Reporter> findAll(int page, int size) {
        return data.values().stream()
                .skip((long) page * size)
                .limit(size)
                .toList();
    }

    @Override
    public List<Reporter> findByFirstname(String firstname) {
        return data.values().stream()
                .filter(r -> r.getFirstname().equals(firstname))
                .toList();
    }

    @Override
    public List<Reporter> findByLastname(String lastname) {
        return data.values().stream()
                .filter(r -> r.getLastname().equals(lastname))
                .toList();
    }

    @Override
    public void delete(Reporter reporter) {
        data.remove(reporter.getIdReporter());
    }

    @Override
    public long count() {
        return 0;
    }
}
