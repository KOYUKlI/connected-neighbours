package com.connectneighbours.admindesktop.back.application.statistics;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class FormatPercentage {
    private static final Long PERCENT = 100L;

    public static String formatPercentage(Double rate){
        var percent = rate * PERCENT;
        var bd = new BigDecimal(percent).setScale(2, RoundingMode.HALF_UP);
        var formatted = bd.stripTrailingZeros().toPlainString();
        return formatted + "%";
    }
}
