import time
import numpy as np
import cv2
from insightface.app import FaceAnalysis
import onnxruntime as ort

# --- 1. โหลด Models ---
print("กำลังโหลด Models (InsightFace และ Liveness)...")
# โหลด InsightFace
face_app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=-1, det_size=(640, 640))

# โหลด MiniFASNet (ONNX)
# ** อย่าลืมเปลี่ยน Path ให้ตรงกับที่คุณวางไฟล์ไว้ **
liveness_session = ort.InferenceSession(
    "app/weights/MiniFASNetV2.onnx", providers=["CPUExecutionProvider"]
)

# --- 2. จำลองรูปภาพ ---
# สร้างรูปภาพจำลองขนาด 640x480 (เหมือนเว็บแคม)
dummy_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
# จำลองกรอบใบหน้า (Bounding Box)
dummy_bbox = [100, 100, 300, 300]

print("เริ่มการทดสอบ (Warm-up ระบบก่อน...)...\n")
# Warm-up (รันทิ้ง 1 รอบให้ AI ตื่นตัว)
face_app.get(dummy_image)

ITERATIONS = 50  # จำลองการสแกน 50 รอบ

# ==========================================
# 🚀 TEST 1: เช็คชื่อแบบเดิม (ใช้แค่ InsightFace)
# ==========================================
start_time = time.perf_counter()
for _ in range(ITERATIONS):
    faces = face_app.get(dummy_image)
end_time = time.perf_counter()

total_time_old = end_time - start_time
avg_time_old = (total_time_old / ITERATIONS) * 1000  # แปลงเป็น ms
fps_old = 1000 / avg_time_old

print("-" * 50)
print("🟢 TEST 1: แบบปัจจุบัน (ไม่เช็ค Liveness)")
print(f"สแกน {ITERATIONS} ใบหน้า ใช้เวลาไปทั้งหมด: {total_time_old:.2f} วินาที")
print(f"⏱️ เวลาเฉลี่ยต่อ 1 หน้า: {avg_time_old:.2f} ms")
print(f"🚀 ความเร็วโดยประมาณ: {fps_old:.2f} ใบหน้า / วินาที")
print("-" * 50)


# ==========================================
# 🛡️ TEST 2: เช็คชื่อแบบใหม่ (Liveness + InsightFace)
# ==========================================
start_time = time.perf_counter()
for _ in range(ITERATIONS):
    # 1. เช็ค Liveness ก่อน (จำลองการทำงานเหมือนในระบบจริง)
    face_resize = cv2.resize(dummy_image[100:300, 100:300], (80, 80))
    face_blob = np.expand_dims(
        np.transpose(face_resize.astype(np.float32), (2, 0, 1)), axis=0
    )
    input_name = liveness_session.get_inputs()[0].name
    liveness_session.run(None, {input_name: face_blob})

    # 2. ถ้าผ่าน ค่อยดึง Face Vector
    faces = face_app.get(dummy_image)
end_time = time.perf_counter()

total_time_new = end_time - start_time
avg_time_new = (total_time_new / ITERATIONS) * 1000
fps_new = 1000 / avg_time_new

print("🔴 TEST 2: แบบเพิ่มความปลอดภัย (Liveness + InsightFace)")
print(f"สแกน {ITERATIONS} ใบหน้า ใช้เวลาไปทั้งหมด: {total_time_new:.2f} วินาที")
print(f"⏱️ เวลาเฉลี่ยต่อ 1 หน้า: {avg_time_new:.2f} ms")
print(f"🚀 ความเร็วโดยประมาณ: {fps_new:.2f} ใบหน้า / วินาที")
print("-" * 50)

# ==========================================
# 📉 สรุปผล
# ==========================================
delay_increase = ((avg_time_new - avg_time_old) / avg_time_old) * 100
print(f"📌 สรุป: การใส่ Liveness ทำให้ Server ทำงานช้าลง {delay_increase:.2f}%")
