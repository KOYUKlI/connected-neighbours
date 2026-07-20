package com.connectneighbours.admindesktop.back.application.statistics;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FormatPercentageTest {

    @Test
    void formatPercentage_shouldFormatWholeNumber() {
        assertEquals("50%", FormatPercentage.formatPercentage(0.5));
    }

    @Test
    void formatPercentage_shouldFormatFullRate() {
        assertEquals("100%", FormatPercentage.formatPercentage(1.0));
    }

    @Test
    void formatPercentage_shouldFormatZero() {
        assertEquals("0%", FormatPercentage.formatPercentage(0.0));
    }

    @Test
    void formatPercentage_shouldRoundToTwoDecimals() {
        assertEquals("33.33%", FormatPercentage.formatPercentage(1.0 / 3));
    }

    @Test
    void formatPercentage_shouldStripTrailingZeros() {
        assertEquals("25%", FormatPercentage.formatPercentage(0.25));
    }
}
