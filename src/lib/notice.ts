"use client";

import Swal from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (element) => {
    element.onmouseenter = Swal.stopTimer;
    element.onmouseleave = Swal.resumeTimer;
  },
});

export function notifySuccess(title: string) {
  return toast.fire({
    icon: "success",
    title,
  });
}

export function notifyError(title: string) {
  return toast.fire({
    icon: "error",
    title,
  });
}

export async function confirmAction(title: string, text?: string, confirmButtonText = "ลบ") {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d84b4b",
    cancelButtonColor: "#64746d",
    confirmButtonText,
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
  });

  return result.isConfirmed;
}
