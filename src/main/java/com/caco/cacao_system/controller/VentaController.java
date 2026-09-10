package com.caco.cacao_system.controller;

import com.caco.cacao_system.model.*;
import com.caco.cacao_system.repository.*;
import com.caco.cacao_system.service.ConfiguracionVentaService;
import com.caco.cacao_system.service.TrazabilidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final ClienteRepository clienteRepository;
    private final ProductoInventarioRepository productoRepository;
    private final FacturaRepository facturaRepository;
    private final DetalleFacturaRepository detalleRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final TrazabilidadService trazabilidadService;
    private final ConfiguracionVentaService configuracionVentaService;

    private record LineaVendida(ProductoInventario producto, BigDecimal cantidadKg) {}

    @GetMapping("/clientes")
    public ResponseEntity<?> buscarClientes(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Cliente> porNombre = clienteRepository.findByNombreContainingIgnoreCase(q.trim());
        List<Cliente> porRuc = clienteRepository.findByRucContainingIgnoreCase(q.trim());
        List<Cliente> porDireccion = clienteRepository.findByDireccionContainingIgnoreCase(q.trim());
        Set<Cliente> resultados = new LinkedHashSet<>();
        resultados.addAll(porNombre);
        resultados.addAll(porRuc);
        resultados.addAll(porDireccion);
        return ResponseEntity.ok(resultados.stream().map(c -> Map.of(
            "id", c.getId(),
            "nombre", c.getNombre(),
            "cedula", c.getCedula() != null ? c.getCedula() : "",
            "ruc", c.getRuc() != null ? c.getRuc() : "",
            "telefono", c.getTelefono() != null ? c.getTelefono() : "",
            "direccion", c.getDireccion() != null ? c.getDireccion() : "",
            "activo", c.getActivo()
        )).toList());
    }

    @GetMapping("/productos")
    public ResponseEntity<?> listarProductos() {
        List<ProductoInventario> productos = productoRepository.findByTipo(TipoProducto.CACAO);
        return ResponseEntity.ok(productos.stream().map(p -> Map.of(
            "id", p.getId(),
            "nombre", p.getNombre(),
            "stockActual", p.getStockActual(),
            "unidadMedida", p.getUnidadMedida()
        )).toList());
    }

    @GetMapping("/generar-numero")
    public ResponseEntity<Map<String, String>> generarNumero() {
        long count = facturaRepository.count() + 1;
        String numero = String.format("FAC-%04d-%d", count, LocalDate.now().getYear());
        return ResponseEntity.ok(Map.of("numero", numero));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> obtenerConfig() {
        return ResponseEntity.ok(configComoMapa(configuracionVentaService.obtener()));
    }

    @PutMapping("/config")
    public ResponseEntity<?> actualizarConfig(@RequestBody Map<String, Object> body) {
        try {
            Object ivaRaw = body.get("ivaPorcentaje");
            Object bolsaRaw = body.get("usarPrecioBolsa");
            Object precioRaw = body.get("precioBolsa");
            BigDecimal iva = (ivaRaw == null || ivaRaw.toString().isBlank()) ? null
                    : new BigDecimal(ivaRaw.toString());
            Boolean usarBolsa = (bolsaRaw == null) ? null : Boolean.valueOf(bolsaRaw.toString());
            BigDecimal precio = (precioRaw == null || precioRaw.toString().isBlank()) ? null
                    : new BigDecimal(precioRaw.toString());
            ConfiguracionVenta c = configuracionVentaService.actualizar(iva, usarBolsa, precio);
            return ResponseEntity.ok(configComoMapa(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> configComoMapa(ConfiguracionVenta c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ivaPorcentaje", c.getIvaPorcentaje());
        m.put("usarPrecioBolsa", c.getUsarPrecioBolsa());
        m.put("precioBolsa", c.getPrecioBolsa());
        m.put("fechaPrecioBolsa",
                c.getFechaPrecioBolsa() != null ? c.getFechaPrecioBolsa().toString() : null);
        return m;
    }

    @PostMapping("/registrar")
    @Transactional
    public ResponseEntity<?> registrarVenta(@RequestBody Map<String, Object> body) {
        try {
            String clienteNombre = (String) body.get("clienteNombre");
            if (clienteNombre == null || clienteNombre.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre del cliente es obligatorio"));
            }

            String clienteCedula = (String) body.getOrDefault("clienteCedula", "");
            String clienteRuc = (String) body.getOrDefault("clienteRuc", "");
            String clienteTelefono = (String) body.getOrDefault("clienteTelefono", "");
            String clienteDireccion = (String) body.getOrDefault("clienteDireccion", "");
            String usuarioRegistra = (String) body.getOrDefault("usuarioRegistra", "");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> productos = (List<Map<String, Object>>) body.get("productos");
            if (productos == null || productos.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Debe incluir al menos un producto"));
            }

            BigDecimal subtotal = BigDecimal.ZERO;

            List<DetalleFactura> detalles = new ArrayList<>();
            List<LineaVendida> vendidas = new ArrayList<>();

            for (Map<String, Object> p : productos) {
                Long productoId = Long.valueOf(p.get("productoId").toString());
                String calidad = (String) p.getOrDefault("calidad", "PRIMERA");
                BigDecimal precioKg = new BigDecimal(p.get("precioKg").toString());
                BigDecimal cantidadKg = new BigDecimal(p.get("cantidadKg").toString());

                ProductoInventario producto = productoRepository.findById(productoId)
                        .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));

                if (cantidadKg.compareTo(producto.getStockActual()) > 0) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Stock insuficiente para " + producto.getNombre(),
                        "disponible", producto.getStockActual(),
                        "productoId", productoId
                    ));
                }

                BigDecimal lineSubtotal = precioKg.multiply(cantidadKg);
                subtotal = subtotal.add(lineSubtotal);

                DetalleFactura detalle = new DetalleFactura();
                detalle.setDescripcion(producto.getNombre() + " - " + calidad);
                detalle.setCantidad(cantidadKg.doubleValue());
                detalle.setPrecioUnitario(precioKg.doubleValue());
                detalle.setSubtotal(lineSubtotal.doubleValue());
                detalles.add(detalle);

                producto.setStockActual(producto.getStockActual().subtract(cantidadKg));
                producto.setActualizadoEn(LocalDateTime.now());
                productoRepository.save(producto);
                vendidas.add(new LineaVendida(producto, cantidadKg));

                MovimientoInventario mov = new MovimientoInventario();
                mov.setProducto(producto);
                mov.setTipo(TipoMovimiento.SALIDA);
                mov.setCantidad(cantidadKg);
                mov.setMotivoTipo(MotivoMovimiento.VENTA);
                mov.setMotivo("Venta a: " + clienteNombre);
                movimientoRepository.save(mov);
            }

            BigDecimal tasaIva = configuracionVentaService.obtener().getIvaPorcentaje()
                    .divide(new BigDecimal("100"));
            BigDecimal iva = subtotal.multiply(tasaIva);
            BigDecimal total = subtotal.add(iva);

            String numeroFactura = (String) body.getOrDefault("numeroFactura", "");
            if (numeroFactura.isBlank()) {
                long count = facturaRepository.count() + 1;
                numeroFactura = String.format("FAC-%04d-%d", count, LocalDate.now().getYear());
            }

            Factura factura = new Factura();
            factura.setNumeroFactura(numeroFactura);
            factura.setFechaEmision(LocalDateTime.now());
            factura.setNombreCliente(clienteNombre);
            factura.setCedulaCliente(clienteCedula);
            factura.setRucCliente(clienteRuc);
            factura.setTelefonoCliente(clienteTelefono);
            factura.setDireccionCliente(clienteDireccion);
            factura.setSubtotal(subtotal.doubleValue());
            factura.setIva(iva.doubleValue());
            factura.setTotal(total.doubleValue());
            factura.setEstado(EstadoFactura.EMITIDA);
            factura.setObservaciones("Registrado por: " + usuarioRegistra);
            factura = facturaRepository.save(factura);

            for (DetalleFactura d : detalles) {
                d.setFactura(factura);
                detalleRepository.save(d);
            }

            // Generar trazabilidad de los lotes cosechados vendidos (FIFO por fecha de cosecha)
            int lotesPendientes = 0;
            for (LineaVendida v : vendidas) {
                lotesPendientes += trazabilidadService.registrarVenta(
                        v.producto().getId(), v.producto().getNombre(),
                        v.cantidadKg().doubleValue(), factura.getNumeroFactura(), clienteNombre);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Venta registrada correctamente",
                "facturaId", factura.getId(),
                "numeroFactura", factura.getNumeroFactura(),
                "trazabilidadPendiente", lotesPendientes
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "No fue posible registrar la venta",
                "detalle", e.getMessage()
            ));
        }
    }
}
