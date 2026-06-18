module com.connectneighbours.admindesktop.ui.ui {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;

    requires org.controlsfx.controls;
    requires net.synedra.validatorfx;
    requires org.kordamp.ikonli.javafx;
    requires eu.hansolo.tilesfx;

    opens com.connectneighbours.admindesktop.ui.ui to javafx.fxml;
    exports com.connectneighbours.admindesktop.ui.ui;
}