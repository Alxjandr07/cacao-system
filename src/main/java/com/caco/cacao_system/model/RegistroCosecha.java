package com.caco.cacao_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "registro_cosecha")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroCosecha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numeroLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parcela_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "actividadesMantenimiento"})
    private Parcela parcela;

    @Column(nullable = false)
    private LocalDate fechaCosecha;

    @Column(nullable = false)
    private BigDecimal cantidadKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CalidadGrano calidad;

    private String responsable;

    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_inventario_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductoInventario productoInventario;

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