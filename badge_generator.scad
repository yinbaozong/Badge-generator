/*
  MakerWorld 参数化拼接徽章生成器
  上传 SVG 图案，生成可直接拼接的徽章。
  输出为“底座”和“图案”两个独立实体，可在 Bambu Studio 中分别指定耗材颜色。
*/

/* [图案文件] */
// 上传你的 SVG 图案（请使用闭合路径的矢量图，文字需先转为路径）
svg_file = "default.svg";

/* [徽章外形] */
// 徽章外形：“拼图”是带圆头拼图扣的矩形，宽高相同的拼图徽章可以直接拼在一起
badge_shape = "rect"; // [rect:圆角矩形, hexagon:圆角六边形, puzzle:拼图, logo:Logo外形]
// 徽章宽度（毫米）：六边形为左右对角宽度；Logo外形为图案可占用的最大宽度
badge_width = 40; // [15:1:150]
// 徽章高度（毫米）：宽高相同即为正方形；正六边形的高度约为宽度的 0.87 倍；Logo外形为图案可占用的最大高度
badge_height = 40; // [15:1:150]
// 徽章底座厚度（毫米）；添加磁铁槽时会自动加厚到足够深度
base_thickness = 3; // [1.5:0.1:8]
// 圆角（毫米）：矩形、六边形和拼图为转角圆角，Logo外形为轮廓平滑度（越大越圆润）
corner_radius = 3; // [0:0.5:15]

/* [图案] */
// 图案留边（毫米）：图案到徽章边缘的距离，数值越大图案越小
logo_margin = 4; // [0.5:0.5:20]
// 图案凸起高度（毫米）
logo_height = 1; // [0.2:0.1:5]

/* [磁铁] */
// 背面磁铁槽：选择磁铁规格（直径×厚度）和数量
magnet_preset = "none"; // [none:不需要, 6x2_1:6×2毫米·中心1个, 6x2_2:6×2毫米·左右2个, 6x2_4:6×2毫米·四角4个, 8x2_1:8×2毫米·中心1个, 10x2_1:10×2毫米·中心1个, 10x3_1:10×3毫米·中心1个]

/* [拼图] */
// 拼图间隙（毫米）：仅“拼图”外形生效；拼得太紧就调大，太松就调小
puzzle_clearance = 0.2; // [0.05:0.05:0.6]

/* [Hidden] */
$fn = 64;
eps = 0.01;
min_top_skin = 0.5;

magnet_presets = [
    ["none",    0, 0, 0],
    ["6x2_1",   6, 2, 1],
    ["6x2_2",   6, 2, 2],
    ["6x2_4",   6, 2, 4],
    ["8x2_1",   8, 2, 1],
    ["10x2_1", 10, 2, 1],
    ["10x3_1", 10, 3, 1]
];
magnet_row = [for (row = magnet_presets) if (row[0] == magnet_preset) row][0];

is_rect = badge_shape == "rect";
is_hexagon = badge_shape == "hexagon";
is_logo = badge_shape == "logo";
is_puzzle = badge_shape == "puzzle";

// Puzzle knobs scale with the badge so they stay proportional to its edges.
joint_scale = min(badge_width, badge_height) / 40;
puzzle_neck = 3 * joint_scale;
puzzle_head_radius = 2.5 * joint_scale;
puzzle_head_center = 2.8 * joint_scale;
puzzle_depth = puzzle_head_center + puzzle_head_radius;

safe_radius = min(corner_radius, min(badge_width, badge_height) / 4);
effective_margin = is_puzzle
    ? max(logo_margin, puzzle_depth + puzzle_clearance + 1)
    : logo_margin;
// Hexagon corners cut into the bounding box, so the logo gets a smaller inner area.
logo_box = is_hexagon
    ? [badge_width * 0.72 - 2 * logo_margin, badge_height * 0.85 - 2 * logo_margin]
    : [badge_width - 2 * effective_margin, badge_height - 2 * effective_margin];

magnet_diameter = magnet_row[1];
magnet_thickness = magnet_row[2];
magnet_count = magnet_row[3];
magnet_pocket_diameter = magnet_diameter + 0.3;
magnet_pocket_depth = magnet_thickness + 0.1;
effective_thickness = magnet_count > 0
    ? max(base_thickness, magnet_pocket_depth + min_top_skin)
    : base_thickness;
magnet_spacing_x = badge_width * 0.45;
magnet_spacing_y = badge_height * 0.45;

assert(magnet_row != undef, "磁铁槽选项无效");
assert(is_rect || is_hexagon || is_puzzle || is_logo,
       "外形选项无效");
assert(!is_puzzle || min(badge_width, badge_height) >= 25,
       "拼图徽章的宽度和高度都至少需要 25 毫米");
assert(logo_box[0] >= 5 && logo_box[1] >= 5,
       "图案留边太大，图案已经放不下：请减小图案留边或增大徽章");
assert(magnet_count < 2 || magnet_spacing_x > magnet_pocket_diameter + 1,
       "徽章太窄，放不下多个磁铁槽：请选择中心1个或增大宽度");
assert(magnet_count < 4 || magnet_spacing_y > magnet_pocket_diameter + 1,
       "徽章太矮，放不下四个磁铁槽：请减少数量或增大高度");

// Right/top edges are knobs and left/bottom are sockets, so any two puzzle
// badges of the same size join in both directions.
puzzle_edges = [
    [ badge_width / 2, 0,   0, true],
    [0,  badge_height / 2,  90, true],
    [-badge_width / 2, 0, 180, false],
    [0, -badge_height / 2, 270, false]
];

magnet_positions =
    magnet_count == 1 ? [[0, 0]] :
    magnet_count == 2 ? [[-magnet_spacing_x / 2, 0], [magnet_spacing_x / 2, 0]] :
    magnet_count == 4 ? [
        [-magnet_spacing_x / 2, -magnet_spacing_y / 2],
        [ magnet_spacing_x / 2, -magnet_spacing_y / 2],
        [-magnet_spacing_x / 2,  magnet_spacing_y / 2],
        [ magnet_spacing_x / 2,  magnet_spacing_y / 2]
    ] : [];

module svg_slab() {
    linear_extrude(height = 1)
        import(file = svg_file, center = true);
}

// OpenSCAD cannot read an SVG's bounding box as numbers. The helper copy is
// rotated and stretched so its width is (logo height x box aspect); resizing the
// union to the box width therefore scales by min(box_w / w, box_h / h), fitting
// the logo inside the box without distortion. The z-stacked copy is sliced out.
module logo_fit_2d(box) {
    projection(cut = true)
        translate([0, 0, -10.5])
            intersection() {
                resize([box[0], 0, 0], auto = [true, true, false])
                    union() {
                        svg_slab();
                        scale([box[0] / box[1], 1, 1])
                            rotate([0, 0, 90]) svg_slab();
                        translate([0, 0, 10]) svg_slab();
                    }
                translate([-1000, -1000, 9.5])
                    cube([2000, 2000, 2]);
            }
}

module rounded_2d(radius) {
    if (radius > 0)
        offset(r = radius) offset(delta = -radius) children();
    else
        children();
}

module smoothed_2d(radius) {
    if (radius > 0)
        offset(r = -radius) offset(r = radius) children();
    else
        children();
}

module hexagon_2d() {
    polygon([
        [-badge_width / 4,  badge_height / 2],
        [ badge_width / 4,  badge_height / 2],
        [ badge_width / 2,  0],
        [ badge_width / 4, -badge_height / 2],
        [-badge_width / 4, -badge_height / 2],
        [-badge_width / 2,  0]
    ]);
}

module core_shape_2d() {
    if (is_hexagon)
        rounded_2d(safe_radius) hexagon_2d();
    else if (is_logo)
        smoothed_2d(corner_radius)
            offset(r = logo_margin) logo_fit_2d(logo_box);
    else
        rounded_2d(safe_radius) square([badge_width, badge_height], center = true);
}

module puzzle_knob_2d() {
    union() {
        translate([-eps, -puzzle_neck / 2])
            square([puzzle_head_center + eps, puzzle_neck]);
        translate([puzzle_head_center, 0])
            circle(r = puzzle_head_radius);
    }
}

// A neighbour's knob enters this badge mirrored across the shared edge.
module puzzle_socket_2d() {
    mirror([1, 0])
        offset(delta = puzzle_clearance)
            puzzle_knob_2d();
}

module place_on_edge(edge) {
    translate([edge[0], edge[1]])
        rotate(edge[2])
            children();
}

module badge_outline_2d() {
    if (is_puzzle)
        difference() {
            union() {
                core_shape_2d();
                for (edge = puzzle_edges)
                    if (edge[3])
                        place_on_edge(edge) puzzle_knob_2d();
            }
            for (edge = puzzle_edges)
                if (!edge[3])
                    place_on_edge(edge) puzzle_socket_2d();
        }
    else
        core_shape_2d();
}

module magnet_pockets() {
    for (position = magnet_positions)
        translate([position[0], position[1], -eps])
            cylinder(h = magnet_pocket_depth + eps, d = magnet_pocket_diameter);
}

module badge_base() {
    difference() {
        linear_extrude(height = effective_thickness)
            badge_outline_2d();
        magnet_pockets();
    }
}

module logo_relief() {
    translate([0, 0, effective_thickness])
        linear_extrude(height = logo_height)
            intersection() {
                logo_fit_2d(logo_box);
                badge_outline_2d();
            }
}

color("#F2F2F2") badge_base();
color("#222222") logo_relief();
