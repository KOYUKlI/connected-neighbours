package com.connectneighbours.admindesktop.back.application.statistics;

public class FormatPercentage {
    private static final Long PERCENT = 100L;

    public static String formatPercentage(Double rate){
        var percent = rate * PERCENT;
        return String.format(percent + "%");
    }
}
