package com.caco.cacao_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Insumo que un proveedor suministra. Cada registro queda vinculado a un
 * {@link ProductoInventario} (tipo INSUMO), de modo que lo que el proveedor
 * ofrece también existe en el inventario de la finca.
 */
@Entity
@Table(name = "proveedor_producto")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProveedorProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Proveedor proveedor;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, length = 30)
    private String unidadMedida; // unidades, kg, litros, bolsas, plantas...

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    /** Producto de inventario vinculado (tipo INSUMO). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_inventario_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductoInventario producto;

    @Column(nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    public void prePersist() {
        this.creadoEn = LocalDateTime.now();
    }
}