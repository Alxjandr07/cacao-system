package com.caco.cacao_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sueldo_actividad",
        uniqueConstraints = @UniqueConstraint(columnNames = {"personal_id", "tipo"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SueldoActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Personal personal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoActividad tipo;

    @Column(name = "sueldo_diario", nullable = false, precision = 12, scale = 2)
    private BigDecimal sueldoDiario;
}
