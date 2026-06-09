package com.connectneighbours.admindesktop.back.application.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ReporterManagementTest {

    private ReporterRepository reporterRepo;
    private ReporterManagement management;

    @BeforeEach
    void setup() {
        reporterRepo = new ReporterRepositoryInMemory();
        management = new ReporterManagement(reporterRepo);
    }

    private Reporter createReporter(String fn, String ln) {
        Reporter r = new Reporter(fn, ln);
        return reporterRepo.save(r);
    }

    @Test
    void listReporters_shouldReturnAll() {
        createReporter("A", "X");
        createReporter("B", "Y");

        List<ReporterDTO> list = management.listReporters();

        assertEquals(2, list.size());
    }

    @Test
    void listReporter_withPagination_shouldReturnPagedResult() {
        createReporter("A", "X");
        createReporter("B", "Y");
        createReporter("C", "Z");

        Page<ReporterDTO> page = management.listReporter(PageRequest.of(0, 2));

        assertEquals(2, page.getContent().size());
        assertEquals(3, page.getTotalElements());
    }

    @Test
    void listByFirstname_shouldFilterCorrectly() {
        createReporter("John", "Doe");
        createReporter("John", "Smith");
        createReporter("Alice", "Blue");

        List<ReporterDTO> list = management.listByFirstname("John");

        assertEquals(2, list.size());
        assertTrue(list.stream().allMatch(r -> r.firstname().equals("John")));
    }

    @Test
    void listByLastname_shouldFilterCorrectly() {
        createReporter("John", "Doe");
        createReporter("Alice", "Doe");
        createReporter("Bob", "Smith");

        List<ReporterDTO> list = management.listByLastname("Doe");

        assertEquals(2, list.size());
        assertTrue(list.stream().allMatch(r -> r.lastname().equals("Doe")));
    }

    @Test
    void deleteReporter_shouldRemoveReporter() {
        Reporter r = createReporter("John", "Doe");

        management.deleteReporter(r.getIdReporter());

        assertFalse(reporterRepo.findById(r.getIdReporter()).isPresent());
    }
}
