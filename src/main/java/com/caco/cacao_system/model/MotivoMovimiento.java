package com.caco.cacao_system.model;

public enum MotivoMovimiento {

    COSECHA(Categoria.ENTRADA, "Ingreso por cosecha"),
    COMPRA(Categoria.ENTRADA, "Compra a proveedor"),
    DEVOLUCION(Categoria.ENTRADA, "Devolución de cliente"),
    TRANSFERENCIA_ENTRADA(Categoria.ENTRADA, "Transferencia recibida"),
    AJUSTE_ENTRADA(Categoria.ENTRADA, "Ajuste (entrada)"),

    VENTA(Categoria.SALIDA, "Venta a cliente"),
    MERMA(Categoria.SALIDA, "Merma o pérdida"),
    ROBO(Categoria.SALIDA, "Pérdida por robo"),
    VENCIMIENTO(Categoria.SALIDA, "Producto vencido"),
    TRANSFERENCIA_SALIDA(Categoria.SALIDA, "Transferencia enviada"),
    AJUSTE_SALIDA(Categoria.SALIDA, "Ajuste (salida)"),

    OTRO(Categoria.CUALQUIERA, "Otro motivo");

    private final Categoria categoria;
    private final String descripcion;

    MotivoMovimiento(Categoria categoria, String descripcion) {
        this.categoria = categoria;
        this.descripcion = descripcion;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public boolean aplicaA(TipoMovimiento tipo) {
        if (categoria == Categoria.CUALQUIERA) return true;
        if (tipo == null) return false;
        return (tipo == TipoMovimiento.ENTRADA && categoria == Categoria.ENTRADA)
                || (tipo == TipoMovimiento.SALIDA && categoria == Categoria.SALIDA);
    }

    public enum Categoria {
        ENTRADA,
        SALIDA,
        CUALQUIERA
    }
}