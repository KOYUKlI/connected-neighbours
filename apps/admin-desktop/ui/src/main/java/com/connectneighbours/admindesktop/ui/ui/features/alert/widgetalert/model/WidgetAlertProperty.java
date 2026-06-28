package com.connectneighbours.admindesktop.ui.ui.features.alert.widgetalert.model;

import com.connectneighbours.admindesktop.ui.ui.features.reporter.model.ReporterProperty;
import javafx.beans.property.ObjectProperty;
import javafx.beans.property.ReadOnlyObjectProperty;
import javafx.beans.property.ReadOnlyStringProperty;
import javafx.beans.property.StringProperty;
import javafx.scene.image.Image;
import javafx.scene.paint.Paint;

import java.time.LocalDateTime;

public interface WidgetAlertProperty extends ReadOnlyWidgetAlertProperty {
    StringProperty severityProperty();

    StringProperty statusProperty();

    ReporterProperty reporterProperty();

    StringProperty detailsProperty();

    ReadOnlyStringProperty titleProperty();

    StringProperty reporterNameProperty();

    ObjectProperty<LocalDateTime> createdAtProperty();

    ObjectProperty<LocalDateTime> resolvedAtProperty();

}
