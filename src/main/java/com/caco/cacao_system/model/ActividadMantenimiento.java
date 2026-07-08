package com.caco.cacao_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "actividad_mantenimiento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActividadMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcela_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Parcela parcela;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoActividad tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoActividad estado;

    @Column(nullable = false)
    private LocalDate fechaProgramada;

    private LocalDate fechaRealizada;

    private String responsable;

    // Insumos usados (texto libre por ahora)
    private String insumosUsados; // Ej: "Fertilizante NPK 2kg, Fungicida 500ml"

    private String observaciones;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    private LocalDateTime actualizadoEn;

    @PrePersist
    public void prePersist() {
        this.creadoEn = LocalDateTime.now();
        this.actualizadoEn = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}