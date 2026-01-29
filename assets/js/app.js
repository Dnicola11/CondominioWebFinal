const tableStates = new Map();

const wireTable = (table) => {
  const tableId = table.id;
  if (!tableId || table.dataset.wired === "true") return;

  const searchInput = document.querySelector(
    `.js-search[data-target="${tableId}"]`
  );
  const pagination = document.querySelector(
    `.js-pagination[data-target="${tableId}"]`
  );
  const perPage = Number(table.dataset.perPage || 5);

  const state = {
    currentPage: 1,
    sortState: { index: null, dir: 1 },
    query: "",
  };

  const getRows = () => Array.from(table.querySelectorAll("tbody tr"));

  const render = () => {
    const rows = getRows();
    let filteredRows = rows;
    if (state.query) {
      const q = state.query.toLowerCase();
      filteredRows = rows.filter((row) =>
        row.textContent.toLowerCase().includes(q)
      );
    }

    if (state.sortState.index !== null) {
      const { index, dir } = state.sortState;
      filteredRows.sort((a, b) => {
        const aText = a.children[index]?.textContent.trim() || "";
        const bText = b.children[index]?.textContent.trim() || "";
        const aNum = Number(aText.replace(/[^0-9.-]/g, ""));
        const bNum = Number(bText.replace(/[^0-9.-]/g, ""));
        const bothNumeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);
        if (bothNumeric) {
          return (aNum - bNum) * dir;
        }
        return aText.localeCompare(bText) * dir;
      });
    }

    const start = (state.currentPage - 1) * perPage;
    const end = start + perPage;

    filteredRows.forEach((row, idx) => {
      row.style.display = idx >= start && idx < end ? "" : "none";
    });

    if (pagination) {
      const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
      pagination.innerHTML = "";

      const makeBtn = (label, page, active = false) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "page-btn" + (active ? " active" : "");
        btn.textContent = label;
        btn.addEventListener("click", () => {
          state.currentPage = page;
          render();
        });
        return btn;
      };

      pagination.appendChild(makeBtn("«", Math.max(1, state.currentPage - 1)));

      for (let i = 1; i <= totalPages; i += 1) {
        pagination.appendChild(makeBtn(String(i), i, i === state.currentPage));
      }

      pagination.appendChild(
        makeBtn("»", Math.min(totalPages, state.currentPage + 1))
      );
    }
  };

  const applySearch = (value) => {
    state.query = value.trim();
    state.currentPage = 1;
    render();
  };

  const applySort = (index) => {
    if (state.sortState.index === index) {
      state.sortState.dir = state.sortState.dir * -1;
    } else {
      state.sortState = { index, dir: 1 };
    }
    render();
  };

  if (searchInput) {
    searchInput.addEventListener("input", (event) =>
      applySearch(event.target.value)
    );
  }

  table.querySelectorAll("th.sortable").forEach((th, index) => {
    th.addEventListener("click", () => applySort(index));
  });

  tableStates.set(tableId, { render });
  table.dataset.wired = "true";
  render();
};

const refreshTable = (tableId) => {
  const state = tableStates.get(tableId);
  if (state) state.render();
};

const loadTableData = async (table) => {
  const resource = table.dataset.resource;
  const columns = (table.dataset.columns || "")
    .split(",")
    .map((col) => col.trim())
    .filter(Boolean);
  if (!resource || columns.length === 0) return;

  try {
    const response = await fetch(`/api/${resource}`);
    if (!response.ok) throw new Error("No se pudo cargar datos.");
    const data = await response.json();

    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    data.forEach((row) => {
      const tr = document.createElement("tr");
      columns.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = row[col] ?? "";
        tr.appendChild(td);
      });

      const actionCell = document.createElement("td");
      const encoded = encodeURIComponent(JSON.stringify(row));
      actionCell.innerHTML = `
        <a class="btn btn-primary btn-xs js-edit" href="#" data-resource="${resource}" data-row="${encoded}">Edit</a>
        <a class="btn btn-danger btn-xs js-delete" href="#" data-id="${row[columns[0]]}" data-resource="${resource}">Eliminar</a>
      `;
      tr.appendChild(actionCell);
      tbody.appendChild(tr);
    });

    wireTable(table);
    bindDeleteButtons(table);
    bindEditButtons(table);
    refreshTable(table.id);
  } catch (error) {
    console.error(error);
  }
};

const initTables = () => {
  document.querySelectorAll(".js-table").forEach((table) => {
    wireTable(table);
    if (table.dataset.resource) {
      loadTableData(table);
    }
  });
};

const initModal = () => {
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-open-modal");
      const modal = document.getElementById(target);
      if (modal) {
        if (target === "modalAnuncio") {
          const form = modal.querySelector("form");
          if (form) {
            form.reset();
            const idField = form.querySelector("[name=IdAnuncio]");
            if (idField) idField.value = "";
          }
        }
        modal.classList.add("active");
      }
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) modal.classList.remove("active");
    });
  });
};

const initLogin = () => {
  const form = document.querySelector(".js-login");
  if (!form) return;
  const alertBox = document.querySelector("#login-alert");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const usuario = form.querySelector("[name=usuario]").value.trim();
    const pass = form.querySelector("[name=password]").value.trim();
    if (!usuario || !pass) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent =
          "Completa el usuario/correo y la contrasena para ingresar.";
      }
      return;
    }
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password: pass }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error de login");
      localStorage.setItem("condominio_user", JSON.stringify(data.user));
      const role = data.user?.rol || "admin";
      window.location.href = role === "residente" ? "residente.html" : "index.html";
    } catch (error) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = error.message;
      }
    }
  });
};

const bindDeleteButtons = (scope = document) => {
  scope.querySelectorAll(".js-delete").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const resource = button.dataset.resource;
      const id = button.dataset.id;
      if (!resource || !id) return;
      if (!window.confirm("Deseas eliminar este registro?")) return;
      try {
        const response = await fetch(`/api/${resource}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("No se pudo eliminar.");
        const table = button.closest("table");
        if (table) loadTableData(table);
      } catch (error) {
        window.alert(error.message);
      }
    });
  });
};

const bindEditButtons = (scope = document) => {
  scope.querySelectorAll(".js-edit").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const resource = button.dataset.resource;
      if (resource !== "anuncios") return;
      const modal = document.getElementById("modalAnuncio");
      if (!modal) return;
      const form = modal.querySelector("form");
      const row = button.dataset.row
        ? JSON.parse(decodeURIComponent(button.dataset.row))
        : null;
      if (form && row) {
        form.querySelector("[name=IdAnuncio]").value = row.IdAnuncio || "";
        form.querySelector("[name=Titulo]").value = row.Titulo || "";
        form.querySelector("[name=Descripcion]").value = row.Descripcion || "";
        form.querySelector("[name=Fecha]").value = row.Fecha || "";
        form.querySelector("[name=ImagenUrl]").value = row.ImagenUrl || "";
      }
      modal.classList.add("active");
    });
  });
};

const initActions = () => {
  document.querySelectorAll(".js-refresh").forEach((button) => {
    button.addEventListener("click", () => {
      window.alert("Datos actualizados (demo).");
    });
  });

  bindDeleteButtons(document);
};

const initCrudForms = () => {
  document.querySelectorAll(".js-modal-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const resource = form.dataset.resource;
      const tableId = form.dataset.table;
      if (!resource) return;

      const isUpload = form.dataset.upload === "true";
      const idField = form.querySelector("[name=IdAnuncio]");
      const isEdit = idField && idField.value;
      let url = `/api/${resource}`;
      let method = "POST";
      if (isEdit) {
        url = `/api/${resource}/${idField.value}`;
        method = "PUT";
      }

      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => {
        if (value !== "") payload[key] = value;
      });

      try {
        const response = await fetch(url, {
          method,
          headers: isUpload ? undefined : { "Content-Type": "application/json" },
          body: isUpload ? formData : JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("No se pudo guardar.");
        const modal = form.closest(".modal");
        if (modal) modal.classList.remove("active");
        if (tableId) {
          const table = document.getElementById(tableId);
          if (table) loadTableData(table);
        }
        form.reset();
        if (idField) idField.value = "";
        if (!tableId) {
          window.alert("Registro guardado.");
        }
      } catch (error) {
        window.alert(error.message);
      }
    });
  });
};

const initRegister = () => {
  const form = document.querySelector(".js-register");
  if (!form) return;
  const alertBox = form.querySelector("#register-alert");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const usuario = form.querySelector("[name=usuario]").value.trim();
    const email = form.querySelector("[name=email]").value.trim();
    const password = form.querySelector("[name=password]").value.trim();
    const idResidente = form.querySelector("[name=IdResidente]")?.value.trim();

    if (!usuario || !email || !password) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = "Completa todos los campos.";
      }
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, email, password, IdResidente: idResidente }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error de registro");

      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = "Cuenta creada. Ya puedes iniciar sesion.";
      }
      const modal = form.closest(".modal");
      if (modal) modal.classList.remove("active");
      form.reset();
    } catch (error) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = error.message;
      }
    }
  });
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("condominio_user") || "null");
  } catch (error) {
    return null;
  }
};

const renderAnuncios = async () => {
  const list = document.querySelector("#anuncios-list");
  if (!list) return;
  try {
    const response = await fetch("/api/anuncios");
    const data = await response.json();
    list.innerHTML = "";
    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";
      const imageHtml = item.ImagenUrl
        ? `<img src="${item.ImagenUrl}" alt="${item.Titulo}" style="margin-bottom:10px;" />`
        : "";
      card.innerHTML = `
        ${imageHtml}
        <h3 style="margin:0 0 6px;">${item.Titulo}</h3>
        <div class="card-meta">${item.Fecha || ""}</div>
        <p style="margin:0;">${item.Descripcion || ""}</p>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    console.error(error);
  }
};

const renderCuotas = async (residenteId, estado) => {
  const table = document.querySelector("#tabla-mis-cuotas tbody");
  if (!table) return;
  try {
    const qs = new URLSearchParams({ residenteId: String(residenteId) });
    if (estado) qs.set("estado", estado);
    const response = await fetch(`/api/residente/cuotas?${qs.toString()}`);
    const data = await response.json();
    table.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      const comprobante = row.ComprobanteUrl
        ? `<a href="${row.ComprobanteUrl}" target="_blank">Ver</a>`
        : "";
      let action = "-";
      if (row.Estado === "Pendiente") {
        action = `<button class="btn btn-primary btn-xs js-pagar" data-id="${row.IdCuota}" data-monto="${row.Monto}">Pagar</button>`;
      } else if (row.Estado === "En revision") {
        action = "Enviado";
      }
      tr.innerHTML = `
        <td>${row.IdCuota}</td>
        <td>${row.FechaEmision || ""}</td>
        <td>${row.FechaVen || ""}</td>
        <td>${row.Concepto || ""}</td>
        <td>${row.Monto ?? ""}</td>
        <td>${row.Estado || ""}</td>
        <td>${comprobante}</td>
        <td>${action}</td>
      `;
      table.appendChild(tr);
    });
    bindPagoButtons();
  } catch (error) {
    console.error(error);
  }
};

const renderAreas = async () => {
  const select = document.querySelector("#reserva-area");
  if (!select) return;
  try {
    const response = await fetch("/api/areas");
    const data = await response.json();
    select.innerHTML = "";
    data.forEach((area) => {
      const option = document.createElement("option");
      option.value = area.IdArea;
      option.textContent = area.Nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
};

const renderReservas = async (residenteId) => {
  const table = document.querySelector("#tabla-reservas tbody");
  if (!table) return;
  try {
    const response = await fetch(`/api/reservas?residenteId=${residenteId}`);
    const data = await response.json();
    table.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.IdReserva}</td>
        <td>${row.Area || ""}</td>
        <td>${row.Fecha || ""}</td>
        <td>${row.HoraInicio || ""}</td>
        <td>${row.HoraFin || ""}</td>
        <td>${row.Estado || ""}</td>
      `;
      table.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
  }
};

const renderNotificaciones = async (residenteId) => {
  const list = document.querySelector("#notificaciones-list");
  if (!list) return;
  try {
    const response = await fetch(
      `/api/notificaciones?residenteId=${residenteId}`
    );
    const data = await response.json();
    list.innerHTML = "";
    if (!data.length) {
      list.innerHTML = "<div class=\"card\">No tienes notificaciones.</div>";
      return;
    }
    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-meta">${item.Fecha || ""}</div>
        <p style="margin:6px 0 0;">${item.Mensaje}</p>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    console.error(error);
  }
};

const renderHistorialPagos = async (residenteId) => {
  const table = document.querySelector("#tabla-historial-pagos tbody");
  if (!table) return;
  try {
    const response = await fetch(`/api/pagos?residenteId=${residenteId}`);
    const data = await response.json();
    table.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      const comprobante = row.ComprobanteUrl
        ? `<a href="${row.ComprobanteUrl}" target="_blank">Ver</a>`
        : "";
      tr.innerHTML = `
        <td>${row.IdPago}</td>
        <td>${row.IdCuota}</td>
        <td>${row.FechaPago || ""}</td>
        <td>${row.Monto ?? ""}</td>
        <td>${row.Estado || ""}</td>
        <td>${comprobante}</td>
      `;
      table.appendChild(tr);
    });
  } catch (error) {
    console.error(error);
  }
};

const initReservaForm = () => {
  const form = document.querySelector("#form-reserva");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    const payload = {
      IdResidente: user?.idResidente,
      IdArea: form.querySelector("#reserva-area").value,
      Fecha: form.querySelector("[name=Fecha]").value,
      HoraInicio: form.querySelector("[name=HoraInicio]").value,
      HoraFin: form.querySelector("[name=HoraFin]").value,
    };
    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("No se pudo crear la reserva.");
      form.reset();
      renderReservas(payload.IdResidente);
      window.alert("Reserva enviada.");
    } catch (error) {
      window.alert(error.message);
    }
  });
};

const bindPagoButtons = () => {
  document.querySelectorAll(".js-pagar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById("modalPago");
      if (!modal) return;
      modal.querySelector("[name=IdCuota]").value = btn.dataset.id;
      modal.querySelector("[name=Monto]").value = btn.dataset.monto || "";
      modal.classList.add("active");
    });
  });
};

const initPagoForm = () => {
  const form = document.getElementById("form-pago");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user?.idResidente) {
      window.alert("No hay residente asociado.");
      return;
    }
    const formData = new FormData(form);
    formData.append("IdResidente", user.idResidente);
    try {
      const response = await fetch("/api/pagos", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("No se pudo registrar el pago.");
      const modal = form.closest(".modal");
      if (modal) modal.classList.remove("active");
      form.reset();
      initPagosFilter();
    } catch (error) {
      window.alert(error.message);
    }
  });
};

const renderAdminReservas = async () => {
  const table = document.querySelector("#tabla-reservas-admin tbody");
  if (!table) return;
  try {
    const response = await fetch("/api/reservas/admin");
    const data = await response.json();
    table.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.IdReserva}</td>
        <td>${row.Residente || ""}</td>
        <td>${row.Area || ""}</td>
        <td>${row.Fecha || ""}</td>
        <td>${row.HoraInicio || ""}</td>
        <td>${row.HoraFin || ""}</td>
        <td>${row.Estado || ""}</td>
        <td>
          <button class="btn btn-success btn-xs js-approve" data-id="${row.IdReserva}">Aprobar</button>
          <button class="btn btn-danger btn-xs js-reject" data-id="${row.IdReserva}">Rechazar</button>
        </td>
      `;
      table.appendChild(tr);
    });
    bindReservaActions();
  } catch (error) {
    console.error(error);
  }
};

const bindReservaActions = () => {
  document.querySelectorAll(".js-approve").forEach((btn) => {
    btn.addEventListener("click", () => updateReservaEstado(btn.dataset.id, "Aprobado"));
  });
  document.querySelectorAll(".js-reject").forEach((btn) => {
    btn.addEventListener("click", () => updateReservaEstado(btn.dataset.id, "Rechazado"));
  });
};

const updateReservaEstado = async (id, estado) => {
  try {
    const response = await fetch(`/api/reservas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Estado: estado }),
    });
    if (!response.ok) throw new Error("No se pudo actualizar la reserva.");
    renderAdminReservas();
  } catch (error) {
    window.alert(error.message);
  }
};

const initPagosFilter = () => {
  const checkbox = document.querySelector("#solo-pendientes");
  if (!checkbox) return;
  const user = getCurrentUser();
  if (!user?.idResidente) return;
  const apply = () => {
    renderCuotas(user.idResidente, checkbox.checked ? "Pendiente" : "");
    renderHistorialPagos(user.idResidente);
  };
  checkbox.addEventListener("change", apply);
  apply();
};

const initResidentPages = () => {
  const residentPage = document.body.dataset.role === "residente";
  if (!residentPage) return;
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  if (user.rol !== "residente") return;
  if (!user.idResidente) {
    window.alert("Tu usuario no tiene IdResidente asociado.");
  }
  renderAnuncios();
  if (user.idResidente) {
    renderCuotas(user.idResidente, "Pendiente");
    renderReservas(user.idResidente);
    renderNotificaciones(user.idResidente);
  }
  renderAreas();
  initReservaForm();
};

const initAdminReservasPage = () => {
  if (document.body.dataset.role !== "admin-reservas") return;
  renderAdminReservas();
};

const initAdminPagosPage = () => {
  if (document.body.dataset.role !== "admin-pagos") return;
  renderAdminPagos();
};

const renderAdminPagos = async () => {
  const table = document.querySelector("#tabla-pagos-admin tbody");
  if (!table) return;
  try {
    const response = await fetch("/api/pagos/admin");
    const data = await response.json();
    table.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      const comprobante = row.ComprobanteUrl
        ? `<a href="${row.ComprobanteUrl}" target="_blank">Ver</a>`
        : "";
      tr.innerHTML = `
        <td>${row.IdPago}</td>
        <td>${row.Residente || ""}</td>
        <td>${row.IdCuota}</td>
        <td>${row.FechaPago || ""}</td>
        <td>${row.Monto ?? ""}</td>
        <td>${row.Estado || ""}</td>
        <td>${comprobante}</td>
        <td>
          <button class="btn btn-success btn-xs js-aprobar-pago" data-id="${row.IdPago}">Aprobar</button>
          <button class="btn btn-danger btn-xs js-rechazar-pago" data-id="${row.IdPago}">Rechazar</button>
        </td>
      `;
      table.appendChild(tr);
    });
    bindAdminPagoActions();
  } catch (error) {
    console.error(error);
  }
};

const bindAdminPagoActions = () => {
  document.querySelectorAll(".js-aprobar-pago").forEach((btn) => {
    btn.addEventListener("click", () => updatePagoEstado(btn.dataset.id, "Aprobado"));
  });
  document.querySelectorAll(".js-rechazar-pago").forEach((btn) => {
    btn.addEventListener("click", () => updatePagoEstado(btn.dataset.id, "Rechazado"));
  });
};

const updatePagoEstado = async (id, estado) => {
  try {
    const response = await fetch(`/api/pagos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Estado: estado }),
    });
    if (!response.ok) throw new Error("No se pudo actualizar el pago.");
    renderAdminPagos();
  } catch (error) {
    window.alert(error.message);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initTables();
  initModal();
  initLogin();
  initActions();
  initCrudForms();
  initRegister();
  initResidentPages();
  initPagosFilter();
  initAdminReservasPage();
  initPagoForm();
  initAdminPagosPage();
  if (document.querySelector("#anuncios-list")) {
    renderAnuncios();
  }
});
