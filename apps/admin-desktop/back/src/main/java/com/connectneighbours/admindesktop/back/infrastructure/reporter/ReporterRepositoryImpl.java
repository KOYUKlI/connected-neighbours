package com.connectneighbours.admindesktop.back.infrastructure.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ReporterRepositoryImpl implements ReporterRepository {
    private final ReporterDAO reporterDAO;

    public ReporterRepositoryImpl(ReporterDAO reporterDAO) {
        this.reporterDAO = reporterDAO;
    }

    @Override
    public Reporter save(Reporter reporter) {
        return reporterDAO.save(reporter);
    }

    @Override
    public Optional<Reporter> findById(UUID reporterId) {
        return reporterDAO.findById(reporterId);
    }

    @Override
    public List<Reporter> findAll() {
        return reporterDAO.findAll();
    }

    @Override
    public Page<Reporter> findAll(Pageable pageable) {
        return reporterDAO.findAll(pageable);
    }

    @Override
    public List<Reporter> findByFirstname(String firstname) {
        return reporterDAO.findByFirstname(firstname);
    }

    @Override
    public List<Reporter> findByLastname(String lastname) {
        return reporterDAO.findByLastname(lastname);
    }

    @Override
    public void delete(Reporter reporter) {
        reporterDAO.delete(reporter);
    }

    @Override
    public long count() {
        return reporterDAO.count();
    }
}
