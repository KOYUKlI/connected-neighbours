package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReadOnlyReporterProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;
import javafx.scene.image.Image;
import javafx.scene.paint.Paint;

import java.time.LocalDateTime;
import java.util.List;

public interface ReadOnlyWidgetAlertProperty {
    ReadOnlyStringProperty severityProperty();

    ReadOnlyStringProperty statusProperty();

    ReadOnlyReporterProperty reporterProperty();

    ReadOnlyStringProperty detailsProperty();

    ReadOnlyStringProperty titleProperty();

    ReadOnlyStringProperty reporterNameProperty();

    ReadOnlyObjectProperty<LocalDateTime> createdAtProperty();

    ReadOnlyObjectProperty<LocalDateTime> resolvedAtProperty();

}
