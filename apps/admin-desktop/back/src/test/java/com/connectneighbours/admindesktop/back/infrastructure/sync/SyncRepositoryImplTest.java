package com.connectneighbours.admindesktop.back.infrastructure.sync;

import com.connectneighbours.admindesktop.back.domain.sync.SyncHistoryEntry;
import com.connectneighbours.admindesktop.back.domain.sync.SyncType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

public class SyncRepositoryImplTest {
    private SyncHistoryRepositoryInMemory historyRepo;
    private SyncRepositoryImpl syncRepository;

    private static final String CLIENT_ID = "desktop-1";

    @BeforeEach
    void setup() {
        historyRepo = new SyncHistoryRepositoryInMemory();
        syncRepository = new SyncRepositoryImpl(historyRepo);
    }

    private SyncHistoryEntry entryAt(SyncType type, int count, Instant timestamp) {
        SyncHistoryEntry entry = new SyncHistoryEntry(CLIENT_ID, type, count);
        entry.setTimestamp(timestamp);
        return entry;
    }

    @Test
    void recordPush_shouldPersistAPushEntry() {
        syncRepository.recordPush(CLIENT_ID, 5);

        var history = syncRepository.findHistory(CLIENT_ID);
        assertEquals(1, history.size());
        assertEquals("PUSH", history.get(0).type());
        assertEquals(5, history.get(0).count());
    }

    @Test
    void recordPull_shouldPersistAPullEntry() {
        syncRepository.recordPull(CLIENT_ID, 3);

        var history = syncRepository.findHistory(CLIENT_ID);
        assertEquals(1, history.size());
        assertEquals("PULL", history.get(0).type());
        assertEquals(3, history.get(0).count());
    }

    @Test
    void findHistory_shouldReturnEntriesOrderedByTimestampDesc() {
        Instant now = Instant.now();
        historyRepo.save(entryAt(SyncType.PUSH, 1, now.minus(2, ChronoUnit.MINUTES)));
        historyRepo.save(entryAt(SyncType.PULL, 2, now.minus(1, ChronoUnit.MINUTES)));
        historyRepo.save(entryAt(SyncType.PUSH, 3, now));

        var history = syncRepository.findHistory(CLIENT_ID);

        assertEquals(3, history.size());
        assertEquals(3, history.get(0).count());
        assertEquals(2, history.get(1).count());
        assertEquals(1, history.get(2).count());
    }

    @Test
    void findHistory_shouldReturnEmptyList_forUnknownClient() {
        assertTrue(syncRepository.findHistory("unknown").isEmpty());
    }

    @Test
    void findLastPush_shouldReturnMostRecentPushTimestamp() {
        Instant now = Instant.now();
        historyRepo.save(entryAt(SyncType.PUSH, 1, now.minus(5, ChronoUnit.MINUTES)));
        historyRepo.save(entryAt(SyncType.PUSH, 2, now));
        historyRepo.save(entryAt(SyncType.PULL, 3, now.plus(1, ChronoUnit.MINUTES)));

        assertEquals(now.toString(), syncRepository.findLastPush(CLIENT_ID));
    }

    @Test
    void findLastPull_shouldReturnMostRecentPullTimestamp() {
        Instant now = Instant.now();
        historyRepo.save(entryAt(SyncType.PULL, 1, now.minus(5, ChronoUnit.MINUTES)));
        historyRepo.save(entryAt(SyncType.PULL, 2, now));

        assertEquals(now.toString(), syncRepository.findLastPull(CLIENT_ID));
    }

    @Test
    void findLastPush_shouldReturnNull_whenNoPushRecorded() {
        assertNull(syncRepository.findLastPush(CLIENT_ID));
    }

    @Test
    void findLastPull_shouldReturnNull_whenNoPullRecorded() {
        assertNull(syncRepository.findLastPull(CLIENT_ID));
    }

    @Test
    void applyOperations_shouldNotThrow() {
        assertDoesNotThrow(() -> syncRepository.applyOperations(null));
    }

    @Test
    void countPendingOperations_shouldReturnZero() {
        assertEquals(0, syncRepository.countPendingOperations(CLIENT_ID));
    }
}
