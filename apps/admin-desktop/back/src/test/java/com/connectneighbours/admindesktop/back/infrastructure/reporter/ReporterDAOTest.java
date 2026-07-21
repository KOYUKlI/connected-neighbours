package com.connectneighbours.admindesktop.back.infrastructure.reporter;

import com.connectneighbours.admindesktop.back.domain.reporter.Reporter;
import com.connectneighbours.admindesktop.back.domain.reporter.ReporterRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ReporterDAOTest {

    @Autowired
    private ReporterDAO reporterDAO;

    @Test
    void findByFirstname_shouldReturnMatchingReporters() {
        reporterDAO.save(new Reporter("John", "Doe"));
        reporterDAO.save(new Reporter("John", "Smith"));
        reporterDAO.save(new Reporter("Alice", "Doe"));

        var result = reporterDAO.findByFirstname("John");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(Reporter::getLastname).containsExactlyInAnyOrder("Doe", "Smith");
    }

    @Test
    void findByLastname_shouldReturnMatchingReporters() {
        reporterDAO.save(new Reporter("John", "Doe"));
        reporterDAO.save(new Reporter("Alice", "Doe"));
        reporterDAO.save(new Reporter("Bob", "Smith"));

        var result = reporterDAO.findByLastname("Doe");

        assertThat(result).hasSize(2);
    }

    @Test
    void findByFirstnameAndLastname_shouldReturnExactMatch() {
        reporterDAO.save(new Reporter("John", "Doe"));
        reporterDAO.save(new Reporter("John", "Smith"));

        var result = reporterDAO.findByFirstnameAndLastname("John", "Doe");

        assertThat(result).isPresent();
        assertThat(result.get().getLastname()).isEqualTo("Doe");
    }

    @Test
    void findByFirstnameAndLastname_shouldReturnEmpty_whenNoMatch() {
        reporterDAO.save(new Reporter("John", "Doe"));

        var result = reporterDAO.findByFirstnameAndLastname("Jane", "Doe");

        assertThat(result).isEmpty();
    }

    @Test
    void findByRole_shouldReturnMatchingReporters() {
        reporterDAO.save(new Reporter("John", "Doe", "john@example.com", ReporterRole.RESIDENT));
        reporterDAO.save(new Reporter("Admin", "User", "admin@example.com", ReporterRole.ADMIN));

        var result = reporterDAO.findByRole(ReporterRole.ADMIN);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("admin@example.com");
    }

    @Test
    void findByEmail_shouldReturnMatchingReporter() {
        reporterDAO.save(new Reporter("John", "Doe", "john@example.com", ReporterRole.RESIDENT));

        var result = reporterDAO.findByEmail("john@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getFirstname()).isEqualTo("John");
    }

    @Test
    void findByEmail_shouldReturnEmpty_whenUnknown() {
        var result = reporterDAO.findByEmail("unknown@example.com");

        assertThat(result).isEmpty();
    }
}
