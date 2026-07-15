package com.caco.cacao_system.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "trazabilidad")
public class Trazabilidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_lote", nullable = false, unique = true, length = 30)
    private String codigoLote;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(name = "parcela", length = 100)
    private String parcela;

    @Column(name = "fecha_cosecha")
    private LocalDateTime fechaCosecha;

    @Column(name = "cantidad_cosechada")
    private Double cantidadCosechada;

    @Column(name = "cantidad_procesada")
    private Double cantidadProcesada;

    @Column(name = "cantidad_vendida")
    private Double cantidadVendida;

    @Column(name = "numero_factura", length = 20)
    private String numeroFactura;

    @Column(name = "nombre_cliente", length = 100)
    private String nombreCliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoLote estadoLote = EstadoLote.COSECHADO;

    @Column(name = "observaciones", length = 300)
    private String observaciones;
}
